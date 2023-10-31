export const ACCEPT_ENCODING = 'Accept-Encoding' as const;
export const BROTLI = 'br' as const;
export const DEFLATE = 'deflate' as const;
export const GZIP = 'gzip' as const;
export const SUPPORTED_ENCODINGS = [BROTLI, GZIP, DEFLATE] as const;

const CONTENT_ENCODING = 'Content-Encoding' as const;
const CONTENT_TYPE = 'Content-Type' as const;
const VARY = 'Vary' as const;

const CT_TEXT_PLAIN = 'text/plain' as const;
const CT_JSON = 'json' as const;
const CT_APP_JSON_CHARSET = 'application/json;charset=UTF-8' as const;

export const handleCompression = async (
  encoding: (typeof SUPPORTED_ENCODINGS)[number],
  compressor: (input: string) => Buffer,
  input: any,
  options?: ResponseInit,
): Promise<Response> => {
  const { headers, ...rest } = options || {};
  const optionsHeaders = new Headers(headers);
  if (!optionsHeaders.get(VARY)?.includes(ACCEPT_ENCODING)) optionsHeaders.append(VARY, ACCEPT_ENCODING);

  const contentEncodingHeader = { [CONTENT_ENCODING]: encoding } as const;

  if (input instanceof Response) {
    // set/append Vary header with Accept-Encoding
    if (!input.headers.get(VARY)?.includes(ACCEPT_ENCODING)) input.headers.append(VARY, ACCEPT_ENCODING);
    // do not double encode
    if (input.headers.get(CONTENT_ENCODING)) return input;

    const inputCT = input.headers.get(CONTENT_TYPE)?.toLowerCase() ?? '';
    const inputIsText = inputCT.includes(CT_TEXT_PLAIN);

    if (!inputIsText && !inputCT.includes(CT_JSON)) return input;

    // remaining cases caught by block above
    const body = inputIsText ? await input.text() : JSON.stringify(await input.json());

    const newHeaders = new Headers(input.headers);
    newHeaders.append(CONTENT_ENCODING, contentEncodingHeader[CONTENT_ENCODING]);

    for (const [header, value] of optionsHeaders) {
      if (!(newHeaders.get(header) ?? '').includes(value)) newHeaders.append(header, value);
    }

    return new Response(compressor(body), {
      headers: newHeaders,
      status: rest.status ?? input.status,
      statusText: rest.statusText ?? input.statusText,
    });
  }

  if (typeof input !== 'string' && typeof input !== 'object') {
    return new Response(input, { headers: optionsHeaders, ...rest });
  }

  const responseHeaders = new Headers(optionsHeaders);
  responseHeaders.set(CONTENT_ENCODING, encoding);

  let newBody: string;
  if (typeof input === 'object') {
    newBody = JSON.stringify(input);
    responseHeaders.set(CONTENT_TYPE, CT_APP_JSON_CHARSET);
  } else {
    newBody = input;
    const isJson = optionsHeaders.get(CONTENT_TYPE)?.toLowerCase()?.includes(CT_JSON);
    responseHeaders.set(CONTENT_TYPE, isJson ? CT_APP_JSON_CHARSET : CT_TEXT_PLAIN);
  }

  return new Response(compressor(newBody), { headers: responseHeaders, ...rest });
};
