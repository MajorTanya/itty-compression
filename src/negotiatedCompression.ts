import { brotliWrapper, deflateWrapper, gzipWrapper } from './util/wrappers.js';
import { handleCompression } from './util/compressor.js';
import { ACCEPT_ENCODING, SUPPORTED_ENCODINGS } from './util/constants.js';
import type { Compression, Compressor } from './util/types.js';

const COMPRESSORS: Record<(typeof SUPPORTED_ENCODINGS)[number], Compressor> = {
  br: brotliWrapper,
  gzip: gzipWrapper,
  deflate: deflateWrapper,
} as const;

export const negotiatedCompression: Compression = async (
  originalRequest: Request,
  response: Response,
  options?: ResponseInit,
): Promise<Response> => {
  const acceptedEncodings = originalRequest.headers.get(ACCEPT_ENCODING) ?? '';

  const agreed = SUPPORTED_ENCODINGS.find((encoding) => acceptedEncodings.toLowerCase().includes(encoding));
  if (agreed === undefined) {
    if (!(response.headers.get('Vary') ?? '').includes('Accept-Encoding')) {
      response.headers.append('Vary', 'Accept-Encoding');
    }
    return response;
  }

  return await handleCompression(agreed, COMPRESSORS[agreed], response, options);
};
