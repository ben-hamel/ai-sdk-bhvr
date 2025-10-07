import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { queryConfig } from "@/lib/react-query";
import { ThemeProvider } from "@/providers/theme-provider";

type AppProviderProps = {
  children?: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        {children}
        {/*{import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}*/}
      </ThemeProvider>
    </QueryClientProvider>
  );
};
