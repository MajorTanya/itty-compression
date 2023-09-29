import { brotliWrapper, deflateWrapper, gzipWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, handleCompression, SUPPORTED_ENCODINGS } from './util/compressor.js';
import type { Compression } from './util/types.js';

const COMPRESSIONS: Record<(typeof SUPPORTED_ENCODINGS)[number], (input: any) => Buffer> = {
  br: brotliWrapper,
  gzip: gzipWrapper,
  deflate: deflateWrapper,
};

export const negotiatedCompression: Compression = async (
  originalRequest: Request,
  input: Response | any,
  options?: ResponseInit,
): Promise<Response | any> => {
  const acceptedEncodings = originalRequest.headers.get(ACCEPT_ENCODING) ?? '';

  const agreed = SUPPORTED_ENCODINGS.find((encoding) => acceptedEncodings.toLowerCase().includes(encoding));
  if (agreed === undefined) {
    if (input instanceof Response && !(input.headers.get('Vary') ?? '').includes('Accept-Encoding')) {
      input.headers.append('Vary', 'Accept-Encoding');
    }
    return input;
  }

  const compress = COMPRESSIONS[agreed];

  return await handleCompression(agreed, compress, input, options);
};
