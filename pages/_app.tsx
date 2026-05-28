import '../styles/globals.css';
import { Tooltip as T } from 'radix-ui';
import { QueryClient, QueryClientProvider } from 'react-query';
import 'core-js/features/array/at';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: any) {
  return (
    <QueryClientProvider client={queryClient}>
      <T.Provider>
        <Component {...pageProps} />
      </T.Provider>
    </QueryClientProvider>
  );
}
