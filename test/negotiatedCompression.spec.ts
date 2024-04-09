// noinspection DuplicatedCode

import { describe, expect, it } from 'vitest';
import { negotiatedCompression } from '../src';
import { ACCEPT_ENCODING, BROTLI, CONTENT_ENCODING, DEFLATE, GZIP, VARY } from '../src/util/constants';

describe('negotiatedCompression with intermediate Response', () => {
  it('should not compress if Accept-Encoding is not specified at all', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.body).toBe(input.body);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress if non-standard algorithm is specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'x-funky');

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should prefer brotli (br) if at least all supported algorithms are specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should prefer brotli (br) if only some supported algorithms are specified in Accept-Encoding', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, deflate');

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
  });

  it('should prefer gzip if brotli (br) is not specified in Accept-Encoding and gzip is specified', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'gzip, deflate, x-funky');

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(GZIP);
  });

  it('should prefer deflate if no other supported algorithm is specified in Accept-Encoding and deflate is specified', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'deflate, x-funky');

    const input = new Response('Test Response');

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(DEFLATE);
  });

  it('should set Vary: Accept-Encoding header if not present, and Accept-Encoding is not set in Request', async () => {
    const request = new Request('https://example.com');
    request.headers.delete(ACCEPT_ENCODING);

    const input = new Response('Test Response');
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

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).toBe(input);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should not overwrite Vary header if set in intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, 'br, gzip, deflate');

    const input = new Response('Test Response');
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
    input.headers.set(VARY, ACCEPT_ENCODING);

    const options = { headers: { [VARY]: ACCEPT_ENCODING } };

    const output = await negotiatedCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get(VARY)).toStrictEqual(ACCEPT_ENCODING);
  });

  it('should add headers specified in options that are not present in the intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response');

    const options = { headers: { 'X-Custom-Header': 'x-funky' } };

    const output = await negotiatedCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.headers.get('X-Custom-Header')).toStrictEqual('x-funky');
  });

  it('should fall back to status and status text of intermediate Response if neither is provided as options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response('Test Response', { status: 202, statusText: 'Accepted' });

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.status).toStrictEqual(input.status);
    expect(output.status).toStrictEqual(202);
    expect(output.statusText).toStrictEqual(input.statusText);
    expect(output.statusText).toStrictEqual('Accepted');
  });

  it('should properly set status and status text if provided as options and override the values from intermediate Response', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    // eslint-disable-next-line quotes
    const input = new Response('Test Response', { status: 418, statusText: "I'm a teapot" });
    const options = { status: 202, statusText: 'Accepted' };

    const output = await negotiatedCompression(request, input, options);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toStrictEqual(BROTLI);
    expect(output.status).not.toStrictEqual(input.status);
    expect(output.status).toStrictEqual(options.status);
    expect(output.status).toStrictEqual(202);
    expect(output.statusText).not.toStrictEqual(input.statusText);
    expect(output.statusText).toStrictEqual(options.statusText);
    expect(output.statusText).toStrictEqual('Accepted');
  });

  it('should not compress an empty body but still return new Response object when not passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    const input = new Response();

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress an empty body but still return new Response object and apply passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, BROTLI);

    // eslint-disable-next-line quotes
    const input = new Response(null, { status: 418, statusText: "I'm a teapot" });

    const options = { status: 202, statusText: 'Accepted' };
    const output = await negotiatedCompression(request, input, options);

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

  it('should not compress an empty body with gzip but still return new Response object when not passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, GZIP);

    const input = new Response();

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress an empty body with gzip but still return new Response object and apply passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, GZIP);

    // eslint-disable-next-line quotes
    const input = new Response(null, { status: 418, statusText: "I'm a teapot" });

    const options = { status: 202, statusText: 'Accepted' };
    const output = await negotiatedCompression(request, input, options);

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

  it('should not compress an empty body with deflate but still return new Response object when not passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    const input = new Response();

    const output = await negotiatedCompression(request, input);

    expect(output).toBeInstanceOf(Response);
    expect(output).not.toBe(input);
    expect(output.headers.get(CONTENT_ENCODING)).toBeNull();
  });

  it('should not compress an empty body with deflate but still return new Response object and apply passed options', async () => {
    const request = new Request('https://example.com');
    request.headers.set(ACCEPT_ENCODING, DEFLATE);

    // eslint-disable-next-line quotes
    const input = new Response(null, { status: 418, statusText: "I'm a teapot" });

    const options = { status: 202, statusText: 'Accepted' };
    const output = await negotiatedCompression(request, input, options);

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
