// server/utils/sanitize.ts
// sanitize-html는 서버 측에서만 사용되어야 함
let sanitizeHtml: any;

// 서버 측에서만 sanitize-html 모듈을 가져옴
if (process.server) {
  sanitizeHtml = require('sanitize-html');
}

/**
 * HTML 문자열을 안전하게 정제합니다.
 * XSS 공격 등을 방지하기 위해 잠재적으로 위험한 태그나 속성을 제거합니다.
 *
 * @param html 정제할 HTML 문자열
 * @returns 정제된 HTML 문자열
 */
export function sanitizeHtmlContent(html: string | null | undefined): string {
  if (!html) return '';

  // 클라이언트 측에서는 정제 없이 그대로 반환
  if (!process.server) {
    console.warn('sanitizeHtmlContent는 서버 측에서만 사용해야 합니다.');
    return html;
  }

  return sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class', 'style'],
      span: ['class', 'style'],
      table: ['class', 'style', 'border'],
      th: ['style'],
      td: ['style'],
      '*': ['class']
    },
    // URL은 http://, https://, mailto:, tel: 스키마만 허용
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']  // 이미지는 data URL도 허용
    }
  });
}

/**
 * 객체 내의 HTML 필드들을 재귀적으로 정제합니다.
 *
 * @param obj 정제할 HTML 필드를 포함하는 객체
 * @param htmlFields 정제할 HTML 필드명 목록
 * @returns HTML 필드가 정제된 객체
 */
export function sanitizeObjectHtmlFields<T>(obj: T, htmlFields: string[]): T {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj } as any;

  for (const field of htmlFields) {
    if (field in result && typeof result[field] === 'string') {
      result[field] = sanitizeHtmlContent(result[field]);
    }
  }

  return result as T;
}

/**
 * 객체 배열 내의 HTML 필드들을 정제합니다.
 *
 * @param items 정제할 HTML 필드를 포함하는 객체 배열
 * @param htmlFields 정제할 HTML 필드명 목록
 * @returns HTML 필드가 정제된 객체 배열
 */
export function sanitizeItemsHtmlFields<T>(items: T[], htmlFields: string[]): T[] {
  if (!items || !Array.isArray(items)) return items;

  return items.map(item => sanitizeObjectHtmlFields(item, htmlFields));
}
