import { useCircleHandlers } from 'app/lib/handlers/circle';
import { useLassoHandlers } from 'app/lib/handlers/lasso';
import { useLineHandlers } from 'app/lib/handlers/line';
import { useNoneHandlers } from 'app/lib/handlers/none';
import { usePointHandlers } from 'app/lib/handlers/point';
import { usePolygonHandlers } from 'app/lib/handlers/polygon';
import { useRectangleHandlers } from 'app/lib/handlers/rectangle';
import { Mode } from 'state/jotai';
import type { HandlerContext } from 'types';

export function useHandlers(handlerContext: HandlerContext) {
  const HANDLERS: Record<Mode, Handlers> = {
    [Mode.NONE]: useNoneHandlers(handlerContext),
    [Mode.DRAW_POINT]: usePointHandlers(handlerContext),
    [Mode.DRAW_LINE]: useLineHandlers(handlerContext),
    [Mode.DRAW_POLYGON]: usePolygonHandlers(handlerContext),
    [Mode.DRAW_RECTANGLE]: useRectangleHandlers(handlerContext),
    [Mode.DRAW_CIRCLE]: useCircleHandlers(handlerContext),
    [Mode.LASSO]: useLassoHandlers(handlerContext)
  };
  return HANDLERS;
}
