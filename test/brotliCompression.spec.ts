// noinspection DuplicatedCode

import { describe, expect, it } from 'vitest';
import { brotliCompression } from '../src';

const ACCEPT_ENCODING = 'Accept-Encoding' as const;
const CONTENT_ENCODING = 'Content-Encoding' as const;
const CONTENT_TYPE = 'Content-Type' as const;
const VARY = 'Vary' as const;

const APP_JSON_CHARSET_UTF8 = 'application/json;charset=UTF-8' as const;
const TEXT_PLAIN = 'text/plain' as const;

const BROTLI = 'br' as const;

describe('brotliCompression with intermediate Response', () => {
  it('should not compress if Accept-Encoding is not set', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if intermediate Response has no set Content-Type', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.delete(CONTENT_TYPE);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if non-standard algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if brotli (br) is not among multiple algorithms specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'deflate, gzip, identity, x-my-compressor, x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress again if input is compressed already', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.set(CONTENT_ENCODING, 'x-my-compressor');

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBe(input.headers.get(CONTENT_ENCODING));
  });

  it('should not compress if Content-Type is not text/plain or application/json and not modify intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, 'x-my-content-type');

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBe(input.headers.get(CONTENT_ENCODING));
  });

  it('should compress with brotli if only brotli is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should compress with brotli if brotli is one of multiple listed algorithms in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate, identity, x-my-compressor');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should compress with brotli if brotli (br) is specified in Accept-Encoding and intermediate Response has Content-Type application/json;charset=UTF-8', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response(JSON.stringify({ message: 'Test Response', similarity: 0.6 }));
    input.headers.set(CONTENT_TYPE, APP_JSON_CHARSET_UTF8);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(APP_JSON_CHARSET_UTF8);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should set Vary: Accept-Encoding if not present on intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should append Accept-Encoding to Vary header if already present on intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.set(VARY, 'x-funky');

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).to.include('x-funky');
    expect(output.headers.get(VARY)).to.include(ACCEPT_ENCODING);
  });
});

describe('brotliCompression with text input', () => {
  it('should not compress if non-standard algorithm is specified in Accept-Encoding and return original text', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = 'Test Response';

    const output = await brotliCompression(request, input);

    expect(output).toBe(input);
    expect(output).toBeTypeOf('string');
    expect(output).not.toBeInstanceOf(Response);
  });

  it('should not compress if brotli (br) is not among multiple algorithms specified in Accept-Encoding and return original text', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'deflate, gzip, identity, x-my-compressor, x-funky');

    const input = 'Test Response';

    const output = await brotliCompression(request, input);

    expect(output).toBe(input);
    expect(output).toBeTypeOf('string');
    expect(output).not.toBeInstanceOf(Response);
  });

  it('should compress with brotli if only brotli (br) is specified in Accept-Encoding, set Content-Type, and return Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = 'Test Response';

    const output = await brotliCompression(request, input);

    expect(output).not.toBe(input);
    expect(output.body).not.toStrictEqual(input);
    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should compress with brotli if brotli (br) is one of multiple listed algorithms in Accept-Encoding, set Content-Type, and return Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate, identity, x-my-compressor');

    const input = 'Test Response';

    const output = await brotliCompression(request, input);

    expect(output).not.toBe(input);
    expect(output.body).not.toStrictEqual(input);
    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should compress with brotli if brotli (br) is specified, but not alter Content-Type if Content-Type is set in options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = JSON.stringify({ message: 'Test Response', similarity: 0.6 });
    const options = { headers: { [CONTENT_TYPE]: APP_JSON_CHARSET_UTF8 } };

    const output = await brotliCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(APP_JSON_CHARSET_UTF8);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });
});

describe('brotliCompression with object (json) input', () => {
  it('should not compress if non-standard algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = { message: 'Test Response', similarity: 0.6 };

    const output = await brotliCompression(request, input);

    expect(output).not.toBeInstanceOf(Response);
    expect(output).toBeTypeOf('object');
    expect(output).toBe(input);
  });

  it('should not compress if brotli (br) is not among multiple algorithms specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'deflate, gzip, identity, x-my-compressor, x-funky');

    const input = { message: 'Test Response', similarity: 0.6 };

    const output = await brotliCompression(request, input);

    expect(output).not.toBeInstanceOf(Response);
    expect(output).toBeTypeOf('object');
    expect(output).toBe(input);
  });

  it('should compress with brotli if only brotli (br) is specified in Accept-Encoding, set Content-Type, and return Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = { message: 'Test Response', similarity: 0.6 };

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toStrictEqual(input);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(APP_JSON_CHARSET_UTF8);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should compress with brotli if brotli (br) is one of multiple listed algorithms in Accept-Encoding, set Content-Type, and return Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate, identity, x-my-compressor');

    const input = { message: 'Test Response', similarity: 0.6 };

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toStrictEqual(input);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(APP_JSON_CHARSET_UTF8);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });
});

describe('brotliCompression with non-Response, non-text, non-object input', () => {
  it('should not compress when input is not a Response, not a string, not an object', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = 123;

    const output = await brotliCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });
});
