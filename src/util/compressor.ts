import type { Compressor } from './types.js';
import { ACCEPT_ENCODING, CONTENT_ENCODING, SUPPORTED_ENCODINGS, VARY } from './constants.js';

export const handleCompression = async (
  encoding: (typeof SUPPORTED_ENCODINGS)[number],
  compressor: Compressor,
  input: Response,
  options?: ResponseInit,
): Promise<Response> => {
  // set/append Vary header with Accept-Encoding
  if (!input.headers.get(VARY)?.includes(ACCEPT_ENCODING)) input.headers.append(VARY, ACCEPT_ENCODING);
  // do not double encode
  if (input.headers.get(CONTENT_ENCODING)) return input;

  const { headers, ...optionsRest } = options || {};
  const optionsHeaders = new Headers(headers);
  if (!optionsHeaders.get(VARY)?.includes(ACCEPT_ENCODING)) optionsHeaders.append(VARY, ACCEPT_ENCODING);

  for (const [header, value] of optionsHeaders) {
    if (!(input.headers.get(header) ?? '').includes(value)) input.headers.append(header, value);
  }

  // optionsHeaders values take precedent over input header values but fall back to input values
  const body = await compressor(input.body);

  if (body !== null) input.headers.append(CONTENT_ENCODING, encoding);

  return new Response(body, {
    headers: input.headers,
    status: optionsRest.status ?? input.status,
    statusText: optionsRest.statusText ?? input.statusText,
  });
};
