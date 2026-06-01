import { LongitudeLatitudeInputs } from 'app/components/longitude_latitude_inputs';
import useResettable from 'app/hooks/use_resettable';
import { CVertexId } from 'app/lib/id';
import { getCoordinates, setCoordinates } from 'app/lib/map_operations';
import { usePersistence } from 'app/lib/persistence/context';
import { captureException } from 'integrations/errors';
import type { IWrappedFeature } from 'types';

export default function PointGeometry({
  wrappedFeature,
  vertexId: explicitVertexId
}: {
  wrappedFeature: IWrappedFeature;
  vertexId?: VertexId;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();

  const vertexId = explicitVertexId || new CVertexId(0, 0);

  const [longitude, latitude] = getCoordinates(
    wrappedFeature.feature,
    vertexId
  );

  const longitudeProps = useResettable({
    value: longitude.toString(),
    onCommit(newValue) {
      const num = +newValue;
      if (!Number.isNaN(num)) {
        transact({
          note: 'Manually updated point location',
          putFeatures: [
            {
              ...wrappedFeature,
              feature: setCoordinates({
                breakRectangle: true,
                feature: wrappedFeature.feature,
                position: [num, latitude],
                vertexId
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
          note: 'Manually updated point location',
          putFeatures: [
            {
              ...wrappedFeature,
              feature: setCoordinates({
                breakRectangle: true,
                feature: wrappedFeature.feature,
                position: [longitude, num],
                vertexId
              }).feature
            }
          ]
        }).catch((e) => captureException(e));
      }
    }
  });

  return (
    <div>
      <LongitudeLatitudeInputs
        longitudeProps={longitudeProps}
        latitudeProps={latitudeProps}
      />
    </div>
  );
}
