import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_ADS } from '../src/lib/catalog.ts';
import {
  estimateReadingTime,
  parseExtractedArticle,
  sanitizeExtractedHtml,
} from '../src/lib/reader.ts';
import { generateLocalSummary } from '../src/lib/summarizer.ts';

describe('DEFAULT_ADS (R8)', () => {
  it('defaults testMode to false so admin controls test mode', () => {
    assert.equal(DEFAULT_ADS.testMode, false);
  });
});

describe('reader extraction and sanitization (R13)', () => {
  it('strips script/iframe tags, inline event handlers, and javascript URIs', () => {
    const dirty =
      '<p onclick="alert(1)">Hello</p>' +
      '<script>alert("xss")</script>' +
      '<iframe src="https://evil.example"></iframe>' +
      '<a href="javascript:alert(2)" onmouseover="evil()">Link</a>';
    const clean = sanitizeExtractedHtml(dirty);

    assert.equal(clean.includes('<script'), false);
    assert.equal(clean.includes('<iframe'), false);
    assert.equal(clean.includes('onclick='), false);
    assert.equal(clean.includes('onmouseover='), false);
    assert.equal(clean.includes('javascript:'), false);
    assert.equal(clean.includes('<p>Hello</p>'), true);
    assert.equal(clean.includes('href="#"'), true);
  });

  it('parses extracted article and sanitizes its html', () => {
    const article = parseExtractedArticle(
      {
        title: '  Sample Title  ',
        author: ' Ada ',
        text: 'One two three four five.',
        html: '<p onload="bad()">Body</p><script>x()</script>',
        url: 'https://example.com/post',
      },
      'https://fallback.example/',
    );

    assert.equal(article.title, 'Sample Title');
    assert.equal(article.author, 'Ada');
    assert.equal(article.host, 'example.com');
    assert.equal(article.wordCount, 5);
    assert.equal(article.readMinutes, 1);
    assert.equal(article.html, '<p>Body</p>');
  });

  it('estimates reading time with a minimum of 1 minute', () => {
    assert.equal(estimateReadingTime(0), 1);
    assert.equal(estimateReadingTime(210), 1);
    assert.equal(estimateReadingTime(421), 3);
  });
});

describe('summarizer', () => {
  it('produces a TL;DR and key takeaways from article text', () => {
    const summary = generateLocalSummary({
      title: 'Local-First Browsers',
      author: 'Nexus',
      text: [
        'Local-first software keeps user data on the device by default.',
        'Browsers can summarize articles locally without sending reading history to external servers.',
        'Fast extractive scoring selects the most representative sentences based on term frequency and position.',
      ].join(' '),
      html: '',
      url: 'https://example.com/local-first',
      host: 'example.com',
      wordCount: 38,
      readMinutes: 1,
    });

    assert.equal(summary.tldr.length > 0, true);
    assert.equal(Array.isArray(summary.takeaways), true);
    assert.equal(summary.takeaways.length > 0, true);
    assert.equal(summary.readingTimeMinutes >= 1, true);
  });
});
