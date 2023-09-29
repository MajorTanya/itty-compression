import { ACCEPT_ENCODING, BROTLI, handleCompression } from './util/compressor.js';
import { brotliWrapper } from './util/wrappers.js';
import type { Compression } from './util/types.js';

export const brotliCompression: Compression = async (
  originalRequest: Request,
  input: Response | any,
  options?: ResponseInit,
): Promise<Response | any> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(BROTLI)) return input;

  return await handleCompression(BROTLI, brotliWrapper, input, options);
};
