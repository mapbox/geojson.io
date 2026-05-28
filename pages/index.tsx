import { GeojsonIO } from 'app/components/geojson_io';
import { StrictMode, Suspense, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, Router, Switch } from 'wouter';
import '../styles/globals.css';
import { StyleGuide } from 'app/components/style_guide';
import { UIDMap } from 'app/lib/id_mapper';
import { PersistenceContext } from 'app/lib/persistence/context';
import { MemPersistence } from 'app/lib/persistence/memory';
import { createStore, Provider } from 'jotai';
import { Tooltip as T } from 'radix-ui';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();
const store = createStore();

// initialize mapbox analytics
// @ts-expect-error - loaded from external script
initializeMapboxAnalytics({
  segmentWriteKeyStaging: 'fl0c8p240n',
  marketoMunchkin: false
});

function App() {
  const idMap = useRef(UIDMap.empty());
  return (
    <Suspense fallback={null}>
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <T.Provider>
            <Router base="/next">
              <Switch>
                <Route path="/">
                  <Provider store={store}>
                    <PersistenceContext.Provider
                      value={new MemPersistence(idMap.current, store)}
                    >
                      <title>geojson.io | Powered by Mapbox</title>
                      <GeojsonIO />
                    </PersistenceContext.Provider>
                  </Provider>
                </Route>
                <Route path="/secret-styleguide">
                  <StyleGuide />
                </Route>
              </Switch>
            </Router>
          </T.Provider>
        </QueryClientProvider>
      </StrictMode>
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
