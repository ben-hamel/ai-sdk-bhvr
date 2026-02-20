import type { DefaultOptions, UseMutationOptions } from "@tanstack/react-query";

export const queryConfig = {
  queries: {
    // throwOnError: true,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 1000 * 60,
  },
} satisfies DefaultOptions;

type UnknownFunction = (...args: unknown[]) => unknown;
type UnknownPromiseFunction = (...args: unknown[]) => Promise<unknown>;

export type ApiFnReturnType<FnType extends UnknownPromiseFunction> =
  Awaited<ReturnType<FnType>>;

export type QueryConfig<T extends UnknownFunction> = Omit<
  ReturnType<T>,
  "queryKey" | "queryFn"
>;

export type MutationConfig<
  MutationFnType extends UnknownPromiseFunction,
> = UseMutationOptions<
  ApiFnReturnType<MutationFnType>,
  Error,
  Parameters<MutationFnType>[0]
>;
