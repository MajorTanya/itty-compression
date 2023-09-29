# itty-compression

[![Coverage Status](https://coveralls.io/repos/github/MajorTanya/itty-compression/badge.svg?branch=main)](https://coveralls.io/github/MajorTanya/itty-compression?branch=main)
![Lint Status](https://img.shields.io/github/actions/workflow/status/MajorTanya/itty-compression/testing.yml?label=lint)
![GitHub issues](https://img.shields.io/github/issues/MajorTanya/itty-compression)
![Package version](https://img.shields.io/github/package-json/version/MajorTanya/itty-compression)

A work-in-progress, proof-of-concept compression middleware to provide Response Compression for use
in [itty-router](https://github.com/kwhitley/itty-router) projects.

Probably compatible with a variety of other routers.

Not recommended for production use.

## Features

### No duplicate compression of Responses.

`itty-compression` won't attempt to compress already compressed
Responses again, be it from other routing steps/middleware or from accidentally duplicating it in the route handling.

### Rather small middlewares

While not in the same ballpark as `itty-router` itself, the middlewares are kept as small as possible, with further
optimisations always on the table.

Current sizes are:

| middleware              | size                                                                                                            |
|-------------------------|-----------------------------------------------------------------------------------------------------------------|
| `brotliCompression`     | ![brotliCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/brotliCompression)         |
| `gzipCompression`       | ![gzipCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/gzipCompression)             |
| `deflateCompression`    | ![deflateCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/deflateCompression)       |
| `negotiatedCompression` | ![negotiatedCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/negotiatedCompression) |

### Typed

`itty-compression` is entirely written in TypeScript, so it comes with types automatically.

### Currently supported compressible `Content-Type`s:

- `text/plain`
- `application/json` or `application/json;charset=UTF-8`

### Currently supported compression algorithms:

- brotli (br)
- gzip
- deflate

### Vary Header setting

`itty-compression` will always set the Vary header to include `Accept-Encoding`, even if the response was not
compressed.

## How to use

Install with `npm install @major-tanya/itty-compression` (or your favoured alternative to npm).

Once installed, pick your compression algorithm, or use the flexible `negotiatedCompression` middleware.

### `brotliCompression`, `gzipCompression`, `deflateCompression`

These middlewares offer only one compression algorithm each (brotli, gzip, and deflate, respectively).

Add your pick as a downstream middleware after invoking `router.handle` as such:

```typescript
import { brotliCompression } from 'itty-compression';
// import { deflateCompression } from 'itty-compression';
// import { gzipCompression } from 'itty-compression';
import { error, json, Router } from 'itty-router';

const router = Router();

// downstream json middleware handles stringifying
router.get('/dogs/toto', (request) => {
  name: 'Toto';
  breed: 'Cairn Terrier';
  color: 'black';
});

export default {
  fetch: (request, ...args) => router
    .handle(...args)
    .then(json)
    .then(response => brotliCompression(request, response)) // <-- add the compression handler downstream
    // .then(response => gzipCompression(request, response))
    // .then(response => deflateCompression(request, response))
    .catch(error),
};
```

It's important to add the original request in order for `itty-compression` to be able to respect the
client's `Accept-Encoding` header. If the request (or the header) is not provided, the compression middleware will
function as a no-op, returning the input untouched.

### `negotiatedCompression`

This middleware allows for greater flexibility as to the choice of compression algorithm. It supports all the same
algorithms available as individual middlewares, but will dynamically select which one is used based solely on the
client's `Accept-Encoding` header.

The priority goes `brotli` > `gzip` > `deflate` > no compression.

```typescript
import { negotiatedCompression } from 'itty-compression';
import { error, json, Router } from 'itty-router';

const router = Router();

// downstream json middleware handles stringifying
router.get('/dogs/toto', (request) => {
  name: 'Toto';
  breed: 'Cairn Terrier';
  color: 'black';
});

export default {
  fetch: (request, ...args) => router
    .handle(...args)
    .then(json)
    .then(response => negotiatedCompression(request, response)) // <-- add the compression handler downstream
    .catch(error),
};
```

As with the other middlewares, the original request object is needed to read the client's `Accept-Encoding` header. If
the request is not provided, the `Accept-Encoding` header isn't set, or no mutually supported algorithm could be
determined, this middleware will function as a no-op instead, returning the input untouched.

## Compatibility & Testing

Under construction...

## Goals

- Provide compression for `itty-router` similar to the middleware provided
  by [compression](https://github.com/expressjs/compression/) for [Express](https://github.com/expressjs/express)

## TODO

- More appropriate media types

## Thanks

- [kwhitley](https://github.com/kwhitley) for the creation of the ittiest router I've ever seen.
