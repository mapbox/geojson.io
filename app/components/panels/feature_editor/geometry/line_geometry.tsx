import measureLength from '@turf/length';
import { Input, StyledLabelSpan } from 'app/components/elements';
import { UnitSelect } from 'app/components/unit_select';
import { useUpdateMaybeUser } from 'app/hooks/update_user';
import type {
  IFeature,
  IWrappedFeature,
  LineString,
  MultiLineString
} from 'types';

export function LineGeometry({
  geometry
}: {
  geometry: LineString | MultiLineString;
}) {
  const { user } = useUpdateMaybeUser();
  const length = measureLength(
    geometry as unknown as IFeature<LineString | MultiLineString>,
    {
      units: user.lengthUnits
    }
  );

  return <LengthDisplay label="Length in" length={length} />;
}

export function LineGeometryMulti({
  features
}: {
  features: IWrappedFeature[];
}) {
  const { user } = useUpdateMaybeUser();

  let length = 0;

  for (const { feature } of features) {
    const { geometry } = feature;
    if (
      geometry?.type === 'LineString' ||
      geometry?.type === 'MultiLineString'
    ) {
      length += measureLength(
        {
          type: 'Feature',
          properties: null,
          geometry
        },
        {
          units: user.lengthUnits
        }
      );
    }
  }

  if (length === 0) return null;

  return <LengthDisplay label="Total length in" length={length} />;
}

function LengthDisplay({ length, label }: { length: number; label: string }) {
  const { user, setUser } = useUpdateMaybeUser();
  return (
    <div>
      <StyledLabelSpan>{label}</StyledLabelSpan>
      <div className="flex items-center gap-x-2">
        <Input
          type="text"
          readOnly
          aria-label="Length"
          value={length.toFixed(3)}
        />
        <UnitSelect
          value={user.lengthUnits}
          onChange={(unit) => {
            setUser({
              lengthUnits: unit as any
            });
          }}
          type="length"
        />
      </div>
    </div>
  );
}
