import React, { useMemo, useRef, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { dataAtom } from 'state/jotai';
import { UWrappedFeature } from 'types';
import { geojsonioThemeNoHeight } from 'app/lib/codemirror_theme';
import { useGeoJSONtoFeatureCollection } from 'app/hooks/use_geojson_to_feature_collection';
import { usePersistence } from 'app/lib/persistence/context';
import { newFeatureId } from 'app/lib/id';
import { generateNKeysBetween } from 'fractional-indexing';
import { GeoJSONEditor } from './geojson_editor';
import { useZoomTo } from 'app/hooks/use_zoom_to';
import { getExtent } from 'app/lib/geometry';
import { flattenResult } from '../dialogs/import_utils';

const FeatureCollectionCodeBlock = () => {
  const data = useAtomValue(dataAtom);
  const geoJSONtoFeatureCollection = useGeoJSONtoFeatureCollection();
  const rep = usePersistence();
  const transact = rep.useTransact();
  const dataRef = useRef(data);
  const zoomTo = useZoomTo();
  const zoomToRef = useRef(zoomTo);

  const geojson = useMemo(
    () => UWrappedFeature.mapToFeatureCollection(data.featureMap),
    [data.featureMap]
  );

  const geojsonString = useMemo(
    () => JSON.stringify(geojson, null, 2),
    [geojson]
  );

  useEffect(() => {
    dataRef.current = data;
    zoomToRef.current = zoomTo;
  }, [data, zoomTo]);

  const onChange = async (geojson: any) => {
    const featureMapToDelete = Array.from(dataRef.current.featureMap.keys());
    const fc = geoJSONtoFeatureCollection(geojson);

    const ats = generateNKeysBetween(null, null, fc.features.length);
    // only zoom to the data if there was no prior data
    const shouldZoomTo = fc.features.length !== dataRef.current.featureMap.size;

    await transact({
      note: 'Updated feature collection via JSON panel',
      deleteFeatures: featureMapToDelete,
      putFeatures: fc.features.map((feature, i) => ({
        at: ats[i],
        id: newFeatureId(),
        feature
      }))
    });

    if (shouldZoomTo) {
      const extent = getExtent(
        flattenResult({
          type: 'geojson',
          geojson: fc,
          notes: []
        })
      );

      zoomToRef.current(extent);
    }
  };

  return (
    <div className="relative overflow-auto flex-auto geojsonio-scrollbar group">
      <GeoJSONEditor
        value={geojson}
        onChange={onChange}
        theme={geojsonioThemeNoHeight}
        containerClassName="w-full"
      />
    </div>
  );
};

export default FeatureCollectionCodeBlock;
