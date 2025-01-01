// Headers

export const ACCEPT_ENCODING = 'Accept-Encoding';
export const CONTENT_ENCODING = 'Content-Encoding';
export const VARY = 'Vary';

// Encodings

export const BROTLI = 'br';
export const DEFLATE = 'deflate';
export const GZIP = 'gzip';

export const SUPPORTED_ENCODINGS = [BROTLI, GZIP, DEFLATE] as const;
