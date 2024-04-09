import { handleCompression } from './util/compressor.js';
import { deflateWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, DEFLATE } from './util/constants.js';
import type { Compression } from './util/types.js';

export const deflateCompression: Compression = async (
  originalRequest: Request,
  response: Response,
  options?: ResponseInit,
): Promise<Response> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(DEFLATE)) return response;

  return await handleCompression(DEFLATE, deflateWrapper, response, options);
};
