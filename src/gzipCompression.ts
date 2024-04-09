import { handleCompression } from './util/compressor.js';
import { gzipWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, GZIP } from './util/constants.js';
import type { Compression } from './util/types.js';

export const gzipCompression: Compression = async (
  originalRequest: Request,
  response: Response,
  options?: ResponseInit,
): Promise<Response> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(GZIP)) return response;

  return await handleCompression(GZIP, gzipWrapper, response, options);
};
