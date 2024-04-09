import { handleCompression } from './util/compressor.js';
import { brotliWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, BROTLI } from './util/constants.js';
import type { Compression } from './util/types.js';

export const brotliCompression: Compression = async (
  response: Response,
  originalRequest: Request,
  options?: ResponseInit,
): Promise<Response> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(BROTLI)) return response;

  return await handleCompression(BROTLI, brotliWrapper, response, options);
};
