import { CopyIcon } from '@radix-ui/react-icons';
import { Button, styledSelect } from 'app/components/elements';
import { COPIERS } from 'app/lib/copiers';
import { writeToClipboard } from 'app/lib/utils';
import { Field, Form, Formik } from 'formik';
import { memo, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import type { Geometry, IFeature, IWrappedFeature } from 'types';

type CopyForm = {
  format: keyof typeof COPIERS;
};

export const FeatureEditorExport = memo(function FeatureEditorExport({
  wrappedFeature
}: {
  wrappedFeature: IWrappedFeature;
}) {
  const lastFeature = useRef<IWrappedFeature>(wrappedFeature);
  lastFeature.current = wrappedFeature;

  const onCopy = useCallback(async function onCopy(values: CopyForm) {
    if (lastFeature.current.feature.geometry === null) {
      return toast.error(
        'Could not copy, because this feature has no geometry'
      );
    }
    await toast.promise(
      writeToClipboard(
        COPIERS[values.format](lastFeature.current.feature as IFeature).then(
          (either) => {
            return either.unsafeCoerce();
          }
        )
      ),
      {
        loading: 'Copying…',
        success: 'Copied',
        error: 'Failed to copy. Try again?'
      }
    );
  }, []);

  if (wrappedFeature.feature.geometry === null) return null;

  return (
    <ExportInner type={wrappedFeature.feature.geometry.type} onCopy={onCopy} />
  );
});

const ExportInner = memo(function ExportInner({
  type,
  onCopy
}: {
  type: Geometry['type'];
  onCopy: (arg0: CopyForm) => void;
}) {
  return (
    <div className="px-4 py-4">
      <Formik initialValues={{ format: 'wkt' }} onSubmit={onCopy}>
        <Form className="flex items-center space-x-2">
          <Field
            className={`${styledSelect({ size: 'xs' })} w-full`}
            component="select"
            id="format"
            name="format"
          >
            <option value="wkt">WKT</option>
            <option value="geojson">GeoJSON</option>
            {type === 'LineString' ? (
              <option value="polyline">Polyline</option>
            ) : null}
            {type === 'Point' ? (
              <>
                <option value="geohash">Geohash</option>
                <option value="coordinates">Coordinates</option>
              </>
            ) : null}
            <option value="bbox">BBOX</option>
          </Field>
          <Button type="submit" size="xs">
            <CopyIcon className="w-3 h-3" />
            Copy
          </Button>
        </Form>
      </Formik>
    </div>
  );
});
