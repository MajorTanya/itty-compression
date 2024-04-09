import { brotliCompressSync, deflateSync, gzipSync, type InputType } from 'node:zlib';
import { SUPPORTED_ENCODINGS } from './constants.js';
import type { Compressor } from './types.js';

const COMPRESSIONS: Record<(typeof SUPPORTED_ENCODINGS)[number], (input: InputType, options?: any) => Buffer> = {
  br: brotliCompressSync,
  gzip: gzipSync,
  deflate: deflateSync,
} as const;

const wrapper = async (
  input: ReadableStream<Uint8Array> | null,
  algorithm: keyof typeof COMPRESSIONS,
): Promise<Buffer | null> => {
  return (
    (await input
      ?.getReader()
      .read()
      .then((result) => {
        return result?.value !== undefined ? COMPRESSIONS[algorithm](result.value) : null;
      })) ?? null
  );
};

export const brotliWrapper: Compressor = async (input: ReadableStream<Uint8Array> | null): Promise<Buffer | null> =>
  wrapper(input, 'br');

export const deflateWrapper: Compressor = async (input: ReadableStream<Uint8Array> | null): Promise<Buffer | null> =>
  wrapper(input, 'deflate');

export const gzipWrapper: Compressor = async (input: ReadableStream<Uint8Array> | null): Promise<Buffer | null> =>
  wrapper(input, 'gzip');
