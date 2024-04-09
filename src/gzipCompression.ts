import { handleCompression } from './util/compressor.js';
import { gzipWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, GZIP } from './util/constants.js';
import type { Compression } from './util/types.js';

export const gzipCompression: Compression = async (
  response: Response,
  originalRequest: Request,
  options?: ResponseInit,
): Promise<Response> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(GZIP)) {
    if (!(response.headers.get('Vary') ?? '').includes('Accept-Encoding')) {
      response.headers.append('Vary', 'Accept-Encoding');
    }
    return response;
  }

  return await handleCompression(GZIP, gzipWrapper, response, options);
};
