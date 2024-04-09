export type Compression<
  ResponseType extends Response = Response,
  RequestType extends Request = Request,
  OptionsType extends ResponseInit = ResponseInit,
> = (response: ResponseType, originalRequest: RequestType, options?: OptionsType) => Promise<Response>;

export type Compressor = (input: ReadableStream<Uint8Array> | null) => Promise<Buffer | null>;
