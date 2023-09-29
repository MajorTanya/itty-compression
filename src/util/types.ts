export type Compression = (
  originalRequest: Request,
  input: Response | any,
  options?: ResponseInit,
) => Promise<Response | any>;
