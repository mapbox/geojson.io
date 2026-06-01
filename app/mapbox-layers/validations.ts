import { z } from 'zod';

/**
 * https://github.com/mapbox/tilejson-spec/tree/master/3.0.0
 */
export const zTileJSON = z
  .object({
    tilejson: z.string(),
    tiles: z.array(z.string()),
    attribution: z.string().optional(),
    bounds: z
      .tuple([z.number(), z.number(), z.number(), z.number()])
      .optional(),
    center: z.array(z.number()).optional(),
    minzoom: z.number().default(0),
    maxzoom: z.number().default(24),
    name: z.string().optional(),
    scheme: z.enum(['xyz', 'tms']).optional().default('xyz')
  })
  .strip();
