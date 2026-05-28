import { CrossCircledIcon } from '@radix-ui/react-icons';
import Zoom from 'app/components/icons/zoom';
import { GeometryEditor } from 'app/components/panels/feature_editor/feature_editor_geometry';
import { MapContext } from 'app/context/map_context';
import { getExtent } from 'app/lib/geometry';
import { CVertexId, countVertexes } from 'app/lib/id';
import { usePersistence } from 'app/lib/persistence/context';
import { pluralize } from 'app/lib/utils';
import { captureException } from 'integrations/errors';
import cloneDeep from 'lodash/cloneDeep';
import type { LngLatBoundsLike } from 'mapbox-gl';
import { useContext } from 'react';
import type { GeometryCollection, IWrappedFeature } from 'types';

export function GeometryCollectionEditor({
  geometry: geometryCollection,
  wrappedFeature
}: {
  geometry: GeometryCollection;
  wrappedFeature: IWrappedFeature;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const map = useContext(MapContext);
  let vertexId = new CVertexId(0, 0);
  return (
    <div>
      <div className="text-xs">
        GeometryCollection{' '}
        <span className="uppercase opacity-30 ml-2 font-bold ">
          {pluralize('geometry', geometryCollection.geometries.length)}
        </span>
      </div>
      <div className="divide-y divide-gray-200">
        {geometryCollection.geometries.map((geometry, i) => {
          const lastVertexId = vertexId;
          vertexId = {
            type: 'vertex',
            featureId: vertexId.featureId,
            vertex: vertexId.vertex + countVertexes(geometry)
          };
          return (
            <div className="py-2" key={i}>
              <div className="flex justify-between items-center pb-2">
                <div className="font-bold text-xs flex-auto">
                  #{i + 1} {geometry.type}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const extent = getExtent(geometry);
                    extent.ifJust((extent) => {
                      map?.map.fitBounds(extent as LngLatBoundsLike, {
                        padding: 100,
                        animate: false
                      });
                    });
                  }}
                  title="Zoom & select"
                  className="text-black opacity-20 dark:text-white group-hover:opacity-100 pr-1"
                >
                  <Zoom className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const newFeature = cloneDeep(wrappedFeature.feature);
                    const newCollection =
                      newFeature.geometry as GeometryCollection;
                    newCollection.geometries.splice(i, 1);
                    if (newCollection.geometries.length === 1) {
                      newFeature.geometry = newCollection.geometries[0];
                    }
                    transact({
                      note: 'Removed a geometry from a GeometryCollection',
                      putFeatures: [
                        {
                          ...wrappedFeature,
                          feature: newFeature
                        }
                      ]
                    }).catch((e) => captureException(e));
                  }}
                  title="Delete geometry"
                  className="text-red-500 opacity-40 dark:text-white group-hover:opacity-100"
                >
                  <CrossCircledIcon className="w-3 h-3" />
                </button>
              </div>
              <GeometryEditor
                wrappedFeature={wrappedFeature}
                vertexId={lastVertexId}
                geometry={geometry}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
