import type { ExtractedArticle } from '@/types';
import { hostOf } from './url';

/**
 * Script injected into the WebView to pull out clean article content,
 * stripping ads, sidebars, cookie banners, navbars, and headers.
 */
export const READER_EXTRACTION_SCRIPT = `
(function() {
  try {
    var selectors = [
      'article', '[role="main"]', 'main', '.prose', '[class*="prose"]',
      '.post-content', '.article-content',
      '.entry-content', '.content-article', '#article-body', '.story-body',
      '.post', '.article', '#content'
    ];
    var articleElem = null;
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.innerText && el.innerText.trim().length > 250) {
        articleElem = el;
        break;
      }
    }
    if (!articleElem) {
      articleElem = document.body;
    }

    var clone = articleElem.cloneNode(true);
    var removeSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 'aside', 'noscript',
      'iframe', 'form', '.ad', '.ads', '.advertisement', '.social-share',
      '.comments', '#comments', '.cookie-banner', '.newsletter', '.popup'
    ];
    var badElements = clone.querySelectorAll(removeSelectors.join(','));
    for (var j = 0; j < badElements.length; j++) {
      if (badElements[j].parentNode) {
        badElements[j].parentNode.removeChild(badElements[j]);
      }
    }

    var paragraphs = [];
    var pEls = clone.querySelectorAll('p, h1, h2, h3, h4, blockquote, li');
    for (var k = 0; k < pEls.length; k++) {
      var txt = (pEls[k].innerText || pEls[k].textContent || '').trim();
      if (txt.length > 25) {
        paragraphs.push(txt);
      }
    }

    var plainText = paragraphs.join('\\n\\n') || (clone.innerText || clone.textContent || '').trim();
    var title = document.title || '';
    var h1 = document.querySelector('h1');
    if (h1 && h1.innerText) {
      title = h1.innerText.trim();
    }

    var author = '';
    var metaAuthor = document.querySelector('meta[name="author"], meta[property="article:author"]');
    if (metaAuthor) {
      author = metaAuthor.getAttribute('content') || '';
    }

    var words = plainText.split(/\\s+/).filter(Boolean).length;

    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NEXUS_ARTICLE_EXTRACTED',
        payload: {
          title: title,
          author: author,
          text: plainText,
          html: clone.innerHTML,
          url: window.location.href,
          wordCount: words
        }
      }));
    }
  } catch (err) {
    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'NEXUS_ARTICLE_EXTRACTED',
        payload: {
          title: document.title || '',
          author: '',
          text: document.body ? (document.body.innerText || '') : '',
          html: '',
          url: window.location.href,
          wordCount: 0
        }
      }));
    }
  }
})();
true;
`;

export function estimateReadingTime(wordCount: number): number {
  if (wordCount <= 0) return 1;
  // Average reading speed: ~200-220 words per minute
  return Math.max(1, Math.ceil(wordCount / 210));
}

/**
 * Strips executable tags, inline event handlers, and scriptable URI schemes
 * from HTML extracted across the WebView bridge before storing or rendering it.
 */
export function sanitizeExtractedHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  return rawHtml
    .replace(/<(script|style|iframe|object|embed|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|style|iframe|object|embed|noscript)\b[^>]*\/?>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(
      /\b(href|src|action|formaction)\s*=\s*(['"]?)\s*(?:javascript|vbscript|data:text\/html):[^'"\s>]*/gi,
      '$1=$2#',
    );
}

export function parseExtractedArticle(
  data: {
    title?: string;
    author?: string;
    text?: string;
    html?: string;
    url?: string;
    wordCount?: number;
  },
  currentUrl: string,
): ExtractedArticle {
  const text = (data.text ?? '').trim();
  const wordCount =
    data.wordCount && data.wordCount > 0
      ? data.wordCount
      : text.split(/\s+/).filter(Boolean).length;
  const url = data.url || currentUrl;

  return {
    title: (data.title || '').trim(),
    author: (data.author || '').trim(),
    text,
    html: sanitizeExtractedHtml(data.html || ''),
    url,
    host: hostOf(url),
    wordCount,
    readMinutes: estimateReadingTime(wordCount),
  };
}
