// Headers

export const ACCEPT_ENCODING = 'Accept-Encoding' as const;
export const CONTENT_ENCODING = 'Content-Encoding' as const;
export const VARY = 'Vary' as const;

// Encodings

export const BROTLI = 'br' as const;
export const DEFLATE = 'deflate' as const;
export const GZIP = 'gzip' as const;

export const SUPPORTED_ENCODINGS = [BROTLI, GZIP, DEFLATE] as const;
