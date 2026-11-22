import type { AiSummary, ExtractedArticle } from '@/types';
import { estimateReadingTime } from './reader';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did',
  'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers',
  'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is',
  'isn\'t', 'it', 'it\'s', 'its', 'itself', 'let\'s', 'me', 'more', 'most',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the',
  'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'wasn\'t', 'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which',
  'while', 'who', 'whom', 'why', 'with', 'won\'t', 'would', 'you', 'your',
  'yours', 'yourself', 'yourselves'
]);

function cleanSentences(text: string): string[] {
  // Split on sentence boundaries
  const raw = text
    .replace(/([.?!])\s*(?=[A-Z0-9])/g, '$1|')
    .split('|')
    .map((s) => s.trim().replace(/\s+/g, ' '));

  return raw.filter((s) => {
    if (s.length < 35 || s.length > 320) return false;
    const lower = s.toLowerCase();
    // Exclude cookie / newsletter / share boilerplate
    if (
      lower.includes('cookie') ||
      lower.includes('subscribe') ||
      lower.includes('newsletter') ||
      lower.includes('sign up') ||
      lower.includes('privacy policy') ||
      lower.includes('terms of service') ||
      lower.includes('all rights reserved') ||
      lower.includes('click here') ||
      lower.includes('share this') ||
      lower.includes('follow us') ||
      lower.includes('read more')
    ) {
      return false;
    }
    return true;
  });
}

function calculateWordFrequencies(sentences: string[]): Map<string, number> {
  const freqs = new Map<string, number>();
  for (const s of sentences) {
    const words = s.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    for (const w of words) {
      if (!STOP_WORDS.has(w)) {
        freqs.set(w, (freqs.get(w) || 0) + 1);
      }
    }
  }
  return freqs;
}

/**
 * High-performance smart summarization engine.
 * Generates an executive TL;DR and 3-5 key takeaways instantly without
 * network latency or external API failure points.
 */
export function generateLocalSummary(article: ExtractedArticle): AiSummary {
  const sentences = cleanSentences(article.text);
  const totalReadTime = article.readMinutes || estimateReadingTime(article.wordCount);

  if (sentences.length === 0) {
    return {
      tldr: article.title || 'Summary unavailable for this page.',
      takeaways: ['The content of this page was too short or non-textual to summarize.'],
      readingTimeMinutes: totalReadTime,
      timeSavedMinutes: 0,
    };
  }

  if (sentences.length <= 3) {
    return {
      tldr: sentences[0],
      takeaways: sentences.slice(0, 3),
      readingTimeMinutes: totalReadTime,
      timeSavedMinutes: Math.max(0, totalReadTime - 1),
    };
  }

  const wordFreqs = calculateWordFrequencies(sentences);
  const titleWords = new Set(
    (article.title.toLowerCase().match(/\b[a-z]{3,}\b/g) || []).filter(
      (w) => !STOP_WORDS.has(w),
    ),
  );

  // Score sentences by word salience, title overlap, and document position
  const scored = sentences.map((sentence, index) => {
    const words = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;

    for (const word of words) {
      if (wordFreqs.has(word)) {
        score += wordFreqs.get(word) || 0;
      }
      if (titleWords.has(word)) {
        score += 3; // Boost title relevance
      }
    }

    // Normalized by sentence length
    score = score / Math.max(words.length, 1);

    // Boost intro and concluding sentences
    if (index === 0) score *= 1.45;
    else if (index === 1) score *= 1.25;
    else if (index === sentences.length - 1) score *= 1.2;

    return { sentence, score, index };
  });

  // Pick top sentences
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const targetCount = Math.min(4, Math.max(3, Math.floor(sentences.length / 5)));
  const topSelections = ranked.slice(0, targetCount);

  // Sort back into chronological order so flow makes logical sense
  topSelections.sort((a, b) => a.index - b.index);

  const tldr = topSelections[0]?.sentence || sentences[0];
  const takeaways = topSelections.map((item) => item.sentence);
  const summaryWords = (tldr + ' ' + takeaways.join(' ')).split(/\s+/).length;
  const summaryReadTime = estimateReadingTime(summaryWords);

  return {
    tldr,
    takeaways,
    readingTimeMinutes: totalReadTime,
    timeSavedMinutes: Math.max(1, totalReadTime - summaryReadTime),
  };
}
