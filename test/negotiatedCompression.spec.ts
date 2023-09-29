// noinspection DuplicatedCode

import { describe, expect, it } from 'vitest';
import { negotiatedCompression } from '../src';

const ACCEPT_ENCODING = 'Accept-Encoding' as const;
const CONTENT_ENCODING = 'Content-Encoding' as const;
const CONTENT_TYPE = 'Content-Type' as const;
const VARY = 'Vary' as const;

const TEXT_PLAIN = 'text/plain' as const;

const BROTLI = 'br' as const;
const DEFLATE = 'deflate' as const;
const GZIP = 'gzip' as const;

describe('negotiatedCompression with intermediate Response', () => {
  it('should not compress if Accept-Encoding is not specified at all', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.body).toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if intermediate Response has no set Content-Type', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');
    // simulate previously missed Content-Type by deleting it
    input.headers.delete(CONTENT_TYPE);

    const output = await negotiatedCompression(request, input);

    expect(output).toBe(input);
  });

  it('should not compress if non-standard algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should prefer brotli (br) if at least all supported algorithms are specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should prefer brotli (br) if only some supported algorithms are specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, deflate');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should prefer gzip if brotli (br) is not specified in Accept-Encoding and gzip is specified', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'gzip, deflate, x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(GZIP);
  });

  it('should prefer deflate if no other supported algorithm is specified in Accept-Encoding and deflate is specified', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'deflate, x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
  });

  it('should set Vary: Accept-Encoding header if not present, and Accept-Encoding is not set in Request', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.delete(VARY);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should set Vary: Accept-Encoding header if not present, and no supported algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should not overwrite Vary header if set in intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.set(VARY, 'x-funky');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).to.include('x-funky');
    expect(output.headers.get(VARY)).to.include(ACCEPT_ENCODING);
  });

  it('should not duplicate Accept-Encoding in Vary header if already present in intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.set(VARY, ACCEPT_ENCODING);

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should not duplicate headers that are set in the intermediate Response and the options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);
    input.headers.set(VARY, ACCEPT_ENCODING);

    const options = { headers: { [VARY]: ACCEPT_ENCODING } };

    const output = await negotiatedCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should add headers specified in options that are not present in the intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_TYPE, TEXT_PLAIN);

    const options = { headers: { 'X-Custom-Header': 'x-funky' } };

    const output = await negotiatedCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get('X-Custom-Header')).toStrictEqual('x-funky');
  });
});

describe('negotiatedCompression with text input', () => {
  it('should not compress if Accept-Encoding is not specified at all', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = 'Test Response';

    const output = await negotiatedCompression(request, input);

    expect(output).toBeTypeOf('string');
    expect(output).toBe(input);
  });

  it('should compress with brotli if brotli (br) is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = 'Test Response';

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should set Vary: Accept-Encoding header if not present', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = 'Test Response';

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output.headers.get(CONTENT_TYPE)).toStrictEqual(TEXT_PLAIN);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });
});
