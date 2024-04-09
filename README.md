# itty-compression

[![Coverage Status](https://coveralls.io/repos/github/MajorTanya/itty-compression/badge.svg?branch=main)](https://coveralls.io/github/MajorTanya/itty-compression?branch=main)
![Lint Status](https://img.shields.io/github/actions/workflow/status/MajorTanya/itty-compression/lint.yml?label=lint)
![Test Status](https://img.shields.io/github/actions/workflow/status/MajorTanya/itty-compression/testing.yml?label=tests)
![GitHub issues](https://img.shields.io/github/issues/MajorTanya/itty-compression)
[![Package version](https://img.shields.io/npm/v/@major-tanya/itty-compression)](https://www.npmjs.com/package/@major-tanya/itty-compression)

A work-in-progress, proof-of-concept compression middleware to provide Response Compression for use
in [itty-router](https://github.com/kwhitley/itty-router) projects.

Probably compatible with a variety of other routers.

Not recommended for production use.

## Features

### Your choice of algorithm

`itty-compression` includes:

| Middleware              | Algorithm(s)               |
|-------------------------|----------------------------|
| `brotliCompression`     | brotli (br) *only*         |
| `deflateCompression`    | deflate *only*             |
| `gzipCompression`       | gzip *only*                |
| `negotiatedCompression` | brotli (br), gzip, deflate |

#### What is `negotiatedCompression`?

`negotiatedCompression` compares the client's `Accept-Encoding` header against the list of supported encodings (see
table) and uses the first algorithm both the client and `itty-compression` can agree on. The priority is as follows:

1. brotli (br)
2. gzip
3. deflate
4. no compression

If the client doesn't accept any supported algorithm, the middleware will add the `Vary` header with the
value `Accept-Encoding` (or append the value if the header already exists) to inform the client of this capability.

As with the other middlewares, the original request object is needed to read the client's `Accept-Encoding` header. If
the request is not provided, the `Accept-Encoding` header isn't set, or no mutually supported algorithm could be
determined, this middleware will function as a no-op instead, returning the input with only the `Vary: Accept-Encoding`
header added.

### No duplicate compression of Responses.

`itty-compression` won't attempt to compress already compressed
Responses again, be it from other routing steps/middleware or from accidentally duplicating it in the route handling.

### Rather small middlewares

While not in the same ballpark as `itty-router` itself, the middlewares are kept as small as possible, with further
optimisations always on the table.

Current sizes are:

| middleware              | size                                                                                                                                                                                           |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `brotliCompression`     | [![brotliCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/brotliCompression)](https://bundlejs.com/?q=@major-tanya/itty-compression/brotliCompression)             |
| `deflateCompression`    | [![deflateCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/deflateCompression)](https://bundlejs.com/?q=@major-tanya/itty-compression/deflateCompression)          |
| `gzipCompression`       | [![gzipCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/gzipCompression)](https://bundlejs.com/?q=@major-tanya/itty-compression/gzipCompression)                   |
| `negotiatedCompression` | [![negotiatedCompression](https://deno.bundlejs.com/badge?q=@major-tanya/itty-compression/negotiatedCompression)](https://bundlejs.com/?q=@major-tanya/itty-compression/negotiatedCompression) |

### Typed

`itty-compression` is entirely written in TypeScript, so it comes with types automatically.

### Currently supported compression algorithms:

- brotli (br)
- gzip
- deflate

### Vary Header setting

`itty-compression` will always set the Vary header to include `Accept-Encoding`, even if the response was not
compressed.

## How to use

**`itty-compression` directly depends on Node's zlib via importing `node:zlib`.**

Install with `npm install @major-tanya/itty-compression` (or your favoured alternative to npm).

Once installed, pick your compression algorithm, or use the flexible `negotiatedCompression` middleware
([Your Choice of Algorithm](#your-choice-of-algorithm)).

### `itty-router` v5 with `AutoRouter` or `Router`

The freshly released v5 of `itty-router` includes some more batteries-included routers that allow for some more concise
syntax when using `itty-compression`. Example based on the
[v5 AutoRouter documentation](https://itty.dev/itty-router/routers/autorouter).

Example: `negotiatedCompression` (replace with your middleware of choice)

```typescript
import { negotiatedCompression } from 'itty-compression';
import { AutoRouter } from 'itty-router';

const router = AutoRouter({ // using batteries-included AutoRouter
  finally: [negotiatedCompression],
});
// const router = Router({ // using the medium Router
//  // do not forget to add the json handler for the medium Router before the compression middleware
//  finally: [json, negotiatedCompression],
// });

// AutoRouter's integrated json formatter handles this automatically
router.get('/dogs/toto', (request) => ({
  name: 'Toto',
  breed: 'Cairn Terrier',
  color: 'black',
}));

export default router;
```

### `itty-router` v5 with `IttyRouter` (also `itty-router` v4)

Example: `negotiatedCompression` (replace with your middleware of choice)

```typescript
import { negotiatedCompression } from 'itty-compression';
import { error, IttyRouter, json } from 'itty-router';

// const router = Router(); // only itty-router v4
const router = IttyRouter(); // only itty-router v5

// downstream json middleware handles stringifying
router.get('/dogs/toto', (request) => ({
  name: 'Toto',
  breed: 'Cairn Terrier',
  color: 'black',
}));

export default {
  fetch: (request, ...args) => router
    // .handle(...args) // only itty-router v4
    .fetch(...args) // only itty-router v5
    .then(json) // <-- do not forget an appropriate handler here or you may encounter problems with itty-compression
    .then((response) => negotiatedCompression(response, request)) // <-- add the compression handler downstream
    .catch(error),
};
```

Note: It's important to add the original request in order for `itty-compression` to be able to respect the
client's `Accept-Encoding` header. If the request (or the header) is not provided, the compression middleware will
function as a no-op, returning the input with only the [Vary header added](#vary-header-setting).

## Compatibility & Testing

Known compatible with

- [itty-router v4 & v5](https://github.com/kwhitley/itty-router) (see [How to use](#how-to-use))

Theoretically compatible with any framework/library/router that allows for access to the client request and the
in-progress response before it is sent to the client and also supports async middleware.

## Goals

- Provide compression for `itty-router` similar to the middleware provided
  by [compression](https://github.com/expressjs/compression/) for [Express](https://github.com/expressjs/express)

## TODO

- [ ] More library/framework compatibility data?
- [ ] Code golfing
- [ ] More robust approach to suboptimal inputs

## Thanks

- [kwhitley](https://github.com/kwhitley) for the creation of the ittiest router I've ever seen.
