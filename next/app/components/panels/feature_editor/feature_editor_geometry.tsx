import { Input, StyledLabelSpan, TextWell } from 'app/components/elements';
import { GeometryCollectionEditor } from 'app/components/panels/feature_editor/geometry/geometry_collection_editor';
import {
  LineGeometry,
  LineGeometryMulti
} from 'app/components/panels/feature_editor/geometry/line_geometry';
import PointGeometry from 'app/components/panels/feature_editor/geometry/point_geometry';
import {
  PolygonArea,
  PolygonAreaMulti
} from 'app/components/panels/feature_editor/geometry/polygon_area';
import { e6bbox, getExtent } from 'app/lib/geometry';
import { countVertexes } from 'app/lib/id';
import { pluralize } from 'app/lib/utils';
import { memo } from 'react';
import type { Geometry, IWrappedFeature } from 'types';
import { GeometryTypesGrid } from '../feature_table/feature_table_stats';

function Bbox({ geometry }: { geometry: Geometry }) {
  const bbox = getExtent(geometry, false);

  return bbox.mapOrDefault(
    (bbox) => (
      <StyledLabelSpan>
        Bounding box
        <Input type="text" readOnly value={e6bbox(bbox)} />
      </StyledLabelSpan>
    ),
    null
  );
}

export function GeometryEditor({
  wrappedFeature,
  geometry,
  vertexId
}: {
  wrappedFeature: IWrappedFeature;
  geometry: Geometry;
  vertexId?: VertexId;
}) {
  return geometry.type === 'Polygon' || geometry.type === 'MultiPolygon' ? (
    <div className="space-y-3">
      <Bbox geometry={geometry} />
      <PolygonArea geometry={geometry} />
    </div>
  ) : geometry.type === 'LineString' || geometry.type === 'MultiLineString' ? (
    <div className="space-y-3">
      <Bbox geometry={geometry} />
      <LineGeometry geometry={geometry} />
    </div>
  ) : geometry.type === 'Point' ? (
    <PointGeometry vertexId={vertexId} wrappedFeature={wrappedFeature} />
  ) : geometry.type === 'GeometryCollection' ? (
    <GeometryCollectionEditor
      geometry={geometry}
      wrappedFeature={wrappedFeature}
    />
  ) : null;
}

function MultipleGeometryEditor({
  wrappedFeatures
}: {
  wrappedFeatures: IWrappedFeature[];
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm">
        {pluralize('feature', wrappedFeatures.length)}
      </div>
      <div>
        <GeometryTypesGrid features={wrappedFeatures} />
      </div>
      <PolygonAreaMulti features={wrappedFeatures} />
      <LineGeometryMulti features={wrappedFeatures} />
    </div>
  );
}

function VertexCount({ geometry }: { geometry: Geometry }) {
  return (
    <TextWell>
      {pluralize('Vertex', countVertexes(geometry), true, 'Vertices')}
    </TextWell>
  );
}

export const FeatureEditorGeometry = memo(function FeatureEditorGeometry({
  wrappedFeatures
}: {
  wrappedFeatures: IWrappedFeature[];
}) {
  if (wrappedFeatures.length === 1) {
    const [wrappedFeature] = wrappedFeatures;
    const geometry = wrappedFeature.feature.geometry;
    if (geometry === null) {
      return (
        <div className="space-y-2">
          <TextWell>This feature has no geometry</TextWell>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <GeometryEditor wrappedFeature={wrappedFeature} geometry={geometry} />
        <VertexCount geometry={geometry} />
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <MultipleGeometryEditor wrappedFeatures={wrappedFeatures} />
    </div>
  );
});
