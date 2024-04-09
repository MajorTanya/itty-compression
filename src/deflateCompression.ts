import { handleCompression } from './util/compressor.js';
import { deflateWrapper } from './util/wrappers.js';
import { ACCEPT_ENCODING, DEFLATE } from './util/constants.js';
import type { Compression } from './util/types.js';

export const deflateCompression: Compression = async (
  response: Response,
  originalRequest: Request,
  options?: ResponseInit,
): Promise<Response> => {
  if (!originalRequest.headers.get(ACCEPT_ENCODING)?.toLowerCase().includes(DEFLATE)) {
    if (!(response.headers.get('Vary') ?? '').includes('Accept-Encoding')) {
      response.headers.append('Vary', 'Accept-Encoding');
    }
    return response;
  }

  return await handleCompression(DEFLATE, deflateWrapper, response, options);
};
