import { brotliCompressSync, deflateSync, gzipSync } from 'node:zlib';

export const brotliWrapper = (input: string): Buffer => brotliCompressSync(input);

export const deflateWrapper = (input: string): Buffer => deflateSync(input);

export const gzipWrapper = (input: string): Buffer => gzipSync(input);
