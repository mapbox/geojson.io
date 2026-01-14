import { PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

/**
 * Configuring a distance here so that it's possible
 * to right-click a draggable item as well as drag it.
 */
export function useCustomSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );
}
