import type PMap from 'app/lib/pmap';
import { createContext } from 'react';

export const MapContext = createContext<PMap | null>(null);
