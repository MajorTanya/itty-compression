export type Compression<
  RequestType extends Request = Request,
  ResponseType extends Response = Response,
  OptionsType extends ResponseInit = ResponseInit,
> = (originalRequest: RequestType, response: ResponseType, options?: OptionsType) => Promise<Response>;

export type Compressor = (input: ReadableStream<Uint8Array> | null) => Promise<Buffer | null>;
