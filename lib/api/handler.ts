import { errorResponse } from "./error";

export type ApiContext<
  TParams extends Record<string, string> = Record<string, string>
> = {
  params: Promise<TParams>;
};

type ApiHandler<
  TParams extends Record<string, string> = Record<string, string>
> = (
  request: Request,
  context: ApiContext<TParams>
) => Promise<Response>;

export function apiHandler<
  TParams extends Record<string, string> = Record<string, string>
>(
  handler: ApiHandler<TParams>
) {
  return async (
    request: Request,
    context: ApiContext<TParams>
  ): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return errorResponse(error);
    }
  };
}