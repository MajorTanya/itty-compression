import { ACCEPT_ENCODING, GZIP, handleCompression } from './util/compressor.js';
import { gzipWrapper } from './util/wrappers.js';
import type { Compression } from './util/types.js';

export const gzipCompression: Compression = async (
  originalRequest: Request,
  input: Response | any,
  options?: ResponseInit,
): Promise<Response | any> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(GZIP)) return input;

  return await handleCompression(GZIP, gzipWrapper, input, options);
};
