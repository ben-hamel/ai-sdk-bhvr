import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {useState} from "react";
import { queryConfig } from '@/lib/react-query';

type AppProviderProps = {
  children?: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
                {children}
      {/*{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}*/}
    </QueryClientProvider>
  );
};
