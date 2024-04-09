// noinspection DuplicatedCode

import { describe, expect, it } from 'vitest';
import { deflateCompression } from '../src';
import { ACCEPT_ENCODING, CONTENT_ENCODING, DEFLATE, VARY } from '../src/util/constants';

describe('deflateCompression with intermediate Response', () => {
  it('should not compress if Accept-Encoding is not set', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if non-standard algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if deflate is not among multiple algorithms specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, identity, x-my-compressor, x-funky');

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress again if input is compressed already', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response('Test Response');
    input.headers.set(CONTENT_ENCODING, 'x-my-compressor');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBe(input.headers.get(CONTENT_ENCODING));
  });

  it('should compress with deflate if only deflate is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
  });

  it('should compress with deflate if deflate is one of multiple listed algorithms in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate, identity, x-my-compressor');

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.body).not.toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
  });

  it('should set Vary: Accept-Encoding if not present on intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response('Test Response');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should append Accept-Encoding to Vary header if already present on intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response('Test Response');
    input.headers.set(VARY, 'x-funky');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
    expect(output.headers.get(VARY)).to.include('x-funky');
    expect(output.headers.get(VARY)).to.include(ACCEPT_ENCODING);
  });

  it('should set Vary: Accept-Encoding if not present on intermediate Response even if deflate is not supported', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
    input.headers.delete(VARY);

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should append Accept-Encoding to Vary header if header already present on intermediate Response without Accept-Encoding even if deflate is not supported', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
    input.headers.set(VARY, 'x-funky');

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
    expect(output.headers.get(VARY)).to.contain('x-funky');
    expect(output.headers.get(VARY)).to.contain(ACCEPT_ENCODING);
  });

  it('should fall back to status and status text of intermediate Response if neither is provided as options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    // eslint-disable-next-line quotes
    const input = new Response('Test Response', { status: 418, statusText: "I'm a teapot" });

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
    expect(output.status).toStrictEqual(input.status);
    expect(output.status).toStrictEqual(418);
    expect(output.statusText).toStrictEqual(input.statusText);
    // eslint-disable-next-line quotes
    expect(output.statusText).toStrictEqual("I'm a teapot");
  });

  it('should properly set status and status text if provided as options and override the values from intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    // eslint-disable-next-line quotes
    const input = new Response('Test Response', { status: 418, statusText: "I'm a teapot" });
    const options = { status: 202, statusText: 'Accepted' };

    const output = await deflateCompression(input, request, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
    expect(output.status).not.toStrictEqual(input.status);
    expect(output.status).toStrictEqual(options.status);
    expect(output.status).toStrictEqual(202);
    expect(output.statusText).not.toStrictEqual(input.statusText);
    expect(output.statusText).toStrictEqual(options.statusText);
    expect(output.statusText).toStrictEqual('Accepted');
  });

  it('should not compress an empty body but still return new Response object', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response();

    const output = await deflateCompression(input, request);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress an empty body but still return new Response object and apply passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    // eslint-disable-next-line quotes
    const input = new Response(null, { status: 418, statusText: "I'm a teapot" });

    const options = { status: 202, statusText: 'Accepted' };
    const output = await deflateCompression(input, request, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
    expect(output.status).not.toStrictEqual(input.status);
    expect(output.status).toStrictEqual(options.status);
    expect(output.status).toStrictEqual(202);
    expect(output.statusText).not.toStrictEqual(input.statusText);
    expect(output.statusText).toStrictEqual(options.statusText);
    expect(output.statusText).toStrictEqual('Accepted');
  });
});
