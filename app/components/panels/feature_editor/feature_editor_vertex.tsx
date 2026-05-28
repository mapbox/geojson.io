import { LongitudeLatitudeInputs } from 'app/components/longitude_latitude_inputs';
import useResettable from 'app/hooks/use_resettable';
import { setCoordinates } from 'app/lib/map_operations';
import { getCoordinatesMaybe } from 'app/lib/map_operations/get_coordinates';
import { usePersistence } from 'app/lib/persistence/context';
import { captureException } from 'integrations/errors';
import type { IWrappedFeature } from 'types';

export function FeatureEditorVertex({
  wrappedFeature,
  vertexId
}: {
  wrappedFeature: IWrappedFeature;
  vertexId: VertexId;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();

  const coordinatesMaybe = getCoordinatesMaybe(
    wrappedFeature.feature,
    vertexId
  );

  const [longitude, latitude] = coordinatesMaybe.orDefault([0, 0]);

  const longitudeProps = useResettable({
    value: longitude.toString(),
    onCommit(newValue) {
      const num = +newValue;
      if (!Number.isNaN(num)) {
        transact({
          putFeatures: [
            {
              ...wrappedFeature,
              feature: setCoordinates({
                breakRectangle: true,
                feature: wrappedFeature.feature,
                position: [num, latitude],
                vertexId: vertexId
              }).feature
            }
          ]
        }).catch((e) => captureException(e));
      }
    }
  });
  const latitudeProps = useResettable({
    value: latitude.toString(),
    onCommit(newValue) {
      const num = +newValue;
      if (!Number.isNaN(num)) {
        transact({
          putFeatures: [
            {
              ...wrappedFeature,
              feature: setCoordinates({
                breakRectangle: true,
                feature: wrappedFeature.feature,
                position: [longitude, num],
                vertexId: vertexId
              }).feature
            }
          ]
        }).catch((e) => captureException(e));
      }
    }
  });

  if (coordinatesMaybe.isNothing()) {
    return null;
  }

  return (
    <div className="p-4">
      <LongitudeLatitudeInputs
        longitudeProps={longitudeProps}
        latitudeProps={latitudeProps}
      />
    </div>
  );
}
