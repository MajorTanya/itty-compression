import { ACCEPT_ENCODING, DEFLATE, handleCompression } from './util/compressor.js';
import { deflateWrapper } from './util/wrappers.js';
import type { Compression } from './util/types.js';

export const deflateCompression: Compression = async (
  originalRequest: Request,
  input: Response | any,
  options?: ResponseInit,
): Promise<Response | any> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(DEFLATE)) return input;

  return await handleCompression(DEFLATE, deflateWrapper, input, options);
};
