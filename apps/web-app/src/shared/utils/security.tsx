import React from "react";
import DOMPurify from "isomorphic-dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
}

/**
 * A highly secure React component that renders HTML content safely.
 * It utilizes isomorphic-dompurify to sanitize tags and attributes,
 * successfully mitigating Cross-Site Scripting (XSS) injection vectors.
 */
export const SafeHtml: React.FC<SafeHtmlProps> = ({ html, className }) => {
  const sanitized = React.useMemo(() => {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li",
        "span", "code", "pre", "h1", "h2", "h3", "h4", "h5", "h6"
      ],
      ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
    });
  }, [html]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
};

/**
 * Sanitizes raw HTML strings to remove malicious scripts or tags.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html);
}
