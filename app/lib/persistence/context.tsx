import type { IPersistence } from 'app/lib/persistence/ipersistence';
import { createContext, useContext } from 'react';

const notInContext = {} as IPersistence;

export const PersistenceContext = createContext<IPersistence>(notInContext);

export function usePersistence() {
  return useContext(PersistenceContext);
}
