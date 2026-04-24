import sanitizeHtml from "sanitize-html";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const sanitizeText = (value: string) =>
  sanitizeHtml(value, {
    allowedAttributes: {},
    allowedTags: [],
  }).trim();
