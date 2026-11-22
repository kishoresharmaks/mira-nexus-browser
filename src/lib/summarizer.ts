import type { AiSummary, ExtractedArticle } from '@/types';
import { estimateReadingTime } from './reader';

const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am',
  'an', 'and', 'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been',
  'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot',
  'could', 'couldn\'t', 'did', 'didn\'t', 'do', 'does', 'doesn\'t', 'doing',
  'don\'t', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'her',
  'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in',
  'into', 'is', 'isn\'t', 'it', 'it\'s', 'its', 'itself', 'just', 'let\'s',
  'me', 'more', 'most', 'mustn\'t', 'my', 'myself', 'no', 'nor', 'not', 'of',
  'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she', 'should',
  'shouldn\'t', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs',
  'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those',
  'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'were', 'weren\'t', 'what', 'when', 'where', 'which', 'while', 'who',
  'whom', 'why', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'your',
  'yours', 'yourself', 'yourselves'
]);

const ABBREV_REGEX = /\b(e\.g\.|i\.e\.|et al\.|vs\.|dr\.|mr\.|mrs\.|ms\.|prof\.|inc\.|ltd\.|corp\.|co\.|no\.|fig\.|dept\.|approx\.|u\.s\.|u\.k\.|jan\.|feb\.|mar\.|apr\.|jun\.|jul\.|aug\.|sep\.|sept\.|oct\.|nov\.|dec\.)/gi;

function cleanAndSegmentSentences(text: string): string[] {
  if (!text || !text.trim()) return [];

  // Protect common abbreviations and numbers with decimals from false sentence splits
  let masked = text.replace(ABBREV_REGEX, (match) => match.replace(/\./g, '\u0001'));
  masked = masked.replace(/(\d+)\.(\d+)/g, '$1\u0001$2');

  // Split on sentence boundary punctuation followed by whitespace/newline
  const rawSegments = masked
    .replace(/([.?!])\s+(?=[A-Z0-9"“'‘])/g, '$1\n')
    .split(/\n+/)
    .map((s) => s.replace(/\u0001/g, '.').trim());

  const results: string[] = [];

  for (const raw of rawSegments) {
    // Strip leading list bullets, dashes, markdown asterisks, and numbering
    let cleaned = raw
      .replace(/^[\s\-*•—–#]+/, '')
      .replace(/^\d+[\.\)]\s+/, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Discard sentences outside informative length bounds (35 to 340 chars)
    if (cleaned.length < 35 || cleaned.length > 340) continue;

    // Discard sentences with fewer than 5 words
    const words = cleaned.split(/\s+/);
    if (words.length < 5) continue;

    const lower = cleaned.toLowerCase();
    // Exclude boilerplate, cookie consents, newsletter signups, copyright
    if (
      lower.includes('cookie') ||
      lower.includes('subscribe') ||
      lower.includes('newsletter') ||
      lower.includes('sign up') ||
      lower.includes('privacy policy') ||
      lower.includes('terms of service') ||
      lower.includes('terms of use') ||
      lower.includes('all rights reserved') ||
      lower.includes('click here') ||
      lower.includes('share this') ||
      lower.includes('follow us') ||
      lower.includes('read more') ||
      lower.includes('advertisement') ||
      lower.includes('sponsored by') ||
      lower.includes('leave a comment')
    ) {
      continue;
    }

    results.push(cleaned);
  }

  return results;
}

function tokenize(sentence: string): string[] {
  const matches = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  return matches.filter((w) => !STOP_WORDS.has(w));
}

type SentenceVector = {
  words: Set<string>;
  weights: Map<string, number>;
  norm: number;
};

/**
 * TextRank with Maximal Marginal Relevance (MMR) Summarization Engine.
 *
 * 1. Tokenizes and computes BM25-smoothed TF-IDF sentence vectors.
 * 2. Builds a sentence similarity graph using cosine distance.
 * 3. Runs weighted PageRank power-iteration with lead and title bias.
 * 4. Extracts the executive TL;DR from the primary lead centrality.
 * 5. Uses Maximal Marginal Relevance (MMR, lambda = 0.68) to select diverse,
 *    non-repetitive key takeaways.
 * 6. Sorts takeaways chronologically for narrative coherence.
 */
export function generateLocalSummary(article: ExtractedArticle): AiSummary {
  const sentences = cleanAndSegmentSentences(article.text);
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
    const tldr = sentences[0];
    const takeaways = sentences.slice(0, 3);
    const summaryWords = (tldr + ' ' + takeaways.join(' ')).split(/\s+/).length;
    return {
      tldr,
      takeaways,
      readingTimeMinutes: totalReadTime,
      timeSavedMinutes: Math.max(0, totalReadTime - estimateReadingTime(summaryWords)),
    };
  }

  const N = sentences.length;

  // Title keywords for topical reinforcement
  const titleTokens = new Set(tokenize(article.title || ''));

  // 1. Build document frequency and sentence TF maps
  const tokenizedSentences = sentences.map((s) => tokenize(s));
  const docFreq = new Map<string, number>();
  const termFreqs: Map<string, number>[] = [];

  for (const tokens of tokenizedSentences) {
    const tf = new Map<string, number>();
    const seenInSentence = new Set<string>();

    for (const t of tokens) {
      tf.set(t, (tf.get(t) || 0) + 1);
      if (!seenInSentence.has(t)) {
        seenInSentence.add(t);
        docFreq.set(t, (docFreq.get(t) || 0) + 1);
      }
    }
    termFreqs.push(tf);
  }

  // 2. Compute normalized TF-IDF vectors
  const vectors: SentenceVector[] = [];
  for (let i = 0; i < N; i++) {
    const tf = termFreqs[i];
    const weights = new Map<string, number>();
    let sumSq = 0;

    for (const [term, freq] of tf.entries()) {
      const df = docFreq.get(term) || 1;
      // Smoothed inverse document frequency
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5)) + 1.0;
      const weight = freq * idf;
      weights.set(term, weight);
      sumSq += weight * weight;
    }

    const norm = Math.sqrt(sumSq);
    // Normalize vector
    if (norm > 0) {
      for (const [term, weight] of weights.entries()) {
        weights.set(term, weight / norm);
      }
    }

    vectors.push({
      words: new Set(tf.keys()),
      weights,
      norm,
    });
  }

  // 3. Compute cosine similarity matrix
  const simMatrix: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));

  for (let i = 0; i < N; i++) {
    for (let j = i + 1; j < N; j++) {
      if (vectors[i].norm === 0 || vectors[j].norm === 0) continue;

      let dotProduct = 0;
      const [vSmall, vLarge] =
        vectors[i].words.size < vectors[j].words.size
          ? [vectors[i], vectors[j]]
          : [vectors[j], vectors[i]];

      for (const term of vSmall.words) {
        if (vLarge.words.has(term)) {
          dotProduct += (vSmall.weights.get(term) || 0) * (vLarge.weights.get(term) || 0);
        }
      }

      // Edge threshold filter to eliminate spurious semantic noise
      if (dotProduct >= 0.04) {
        simMatrix[i][j] = dotProduct;
        simMatrix[j][i] = dotProduct;
      }
    }
  }

  // Outgoing degree sums for PageRank normalization
  const outDegreeSum = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    let sum = 0;
    for (let j = 0; j < N; j++) {
      if (i !== j) sum += simMatrix[i][j];
    }
    outDegreeSum[i] = sum;
  }

  // 4. Personalized TextRank Prior Distribution (Lead + Title Bias)
  const prior = new Float64Array(N);
  let priorSum = 0;

  for (let i = 0; i < N; i++) {
    let p = 1.0;

    // News/article inverted pyramid lead bias
    if (i === 0) p *= 2.4;
    else if (i === 1) p *= 1.8;
    else if (i === 2) p *= 1.4;
    else if (i < Math.max(3, Math.floor(N * 0.2))) p *= 1.2;
    else if (i === N - 1) p *= 1.15; // Conclusion boost

    // Title keyword relevance overlap
    let titleOverlap = 0;
    for (const term of vectors[i].words) {
      if (titleTokens.has(term)) titleOverlap++;
    }
    if (titleOverlap > 0) {
      p *= 1 + Math.min(titleOverlap * 0.25, 0.8);
    }

    // Moderate length preference (sweet spot: 60 - 240 chars)
    const len = sentences[i].length;
    if (len < 50) p *= 0.75;
    else if (len > 260) p *= 0.85;

    prior[i] = p;
    priorSum += p;
  }

  // Normalize prior distribution
  for (let i = 0; i < N; i++) {
    prior[i] /= priorSum;
  }

  // 5. TextRank Power Iteration
  const damping = 0.85;
  let scores = new Float64Array(prior);

  for (let iter = 0; iter < 30; iter++) {
    const nextScores = new Float64Array(N);
    let diff = 0;

    for (let i = 0; i < N; i++) {
      let incoming = 0;
      for (let j = 0; j < N; j++) {
        if (i !== j && simMatrix[j][i] > 0 && outDegreeSum[j] > 0) {
          incoming += (simMatrix[j][i] / outDegreeSum[j]) * scores[j];
        }
      }
      nextScores[i] = (1 - damping) * prior[i] + damping * incoming;
      diff += Math.abs(nextScores[i] - scores[i]);
    }

    scores = nextScores;
    if (diff < 1e-4) break; // Convergence reached
  }

  // Normalize scores to [0, 1] range for MMR
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (let i = 0; i < N; i++) {
    if (scores[i] < minScore) minScore = scores[i];
    if (scores[i] > maxScore) maxScore = scores[i];
  }
  const scoreRange = maxScore - minScore || 1e-9;
  const normScores = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    normScores[i] = (scores[i] - minScore) / scoreRange;
  }

  // 6. Select Executive TL;DR
  // TL;DR should be an overarching thesis sentence from the introductory 35% of the article
  const leadWindow = Math.min(N, Math.max(3, Math.ceil(N * 0.35)));
  let bestTldrIdx = 0;
  let bestTldrScore = -1;

  for (let i = 0; i < leadWindow; i++) {
    const positionFactor = i === 0 ? 1.85 : i === 1 ? 1.4 : Math.max(0.8, 1.2 - i * 0.1);
    let titleOverlap = 0;
    for (const term of vectors[i].words) {
      if (titleTokens.has(term)) titleOverlap++;
    }
    const candidateScore = (normScores[i] * 0.6 + 0.4) * positionFactor * (1 + titleOverlap * 0.25);

    if (candidateScore > bestTldrScore) {
      bestTldrScore = candidateScore;
      bestTldrIdx = i;
    }
  }

  const tldr = sentences[bestTldrIdx];

  // 7. Select Diverse Key Takeaways via Maximal Marginal Relevance (MMR)
  const targetTakeaways = Math.min(5, Math.max(3, Math.floor(N / 5)));
  const lambda = 0.68; // Balances centrality vs. diversity

  const selectedIndices: number[] = [];
  const candidateIndices = new Set<number>();

  for (let i = 0; i < N; i++) {
    if (i !== bestTldrIdx) {
      candidateIndices.add(i);
    }
  }

  while (selectedIndices.length < targetTakeaways && candidateIndices.size > 0) {
    let bestCandidate = -1;
    let maxMmr = -Infinity;

    for (const c of candidateIndices) {
      // Compute maximum similarity to already selected sentences + TL;DR
      let maxSimToSelected = simMatrix[c][bestTldrIdx];
      for (const s of selectedIndices) {
        if (simMatrix[c][s] > maxSimToSelected) {
          maxSimToSelected = simMatrix[c][s];
        }
      }

      // MMR formula: lambda * Relevance - (1 - lambda) * MaxSimilarity
      const mmr = lambda * normScores[c] - (1 - lambda) * maxSimToSelected;

      if (mmr > maxMmr) {
        maxMmr = mmr;
        bestCandidate = c;
      }
    }

    if (bestCandidate === -1) break;

    selectedIndices.push(bestCandidate);
    candidateIndices.delete(bestCandidate);
  }

  // 8. Sort takeaways chronologically to preserve logical reading flow
  selectedIndices.sort((a, b) => a - b);
  const takeaways = selectedIndices.map((idx) => sentences[idx]);

  // 9. Compute reading time savings
  const summaryWordCount = (tldr + ' ' + takeaways.join(' ')).split(/\s+/).length;
  const summaryReadTime = estimateReadingTime(summaryWordCount);

  return {
    tldr,
    takeaways,
    readingTimeMinutes: totalReadTime,
    timeSavedMinutes: Math.max(1, totalReadTime - summaryReadTime),
  };
}
