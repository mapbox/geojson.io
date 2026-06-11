import { LayersIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import SimpleDialogActions from 'app/components/dialogs/simple_dialog_actions';
import { TextWell } from 'app/components/elements';
import { LabeledTextField } from 'app/core/components/LabeledTextField';
import { Form, Formik } from 'formik';
import { useAtom } from 'jotai';
import { customRasterLayersAtom } from 'state/jotai';
import type { DialogStateRasterLayer } from 'state/dialog_state';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

interface RasterLayerFormValues {
  name: string;
  tileUrl: string;
}

function isWmsUrl(url: string): boolean {
  return /service=wms/i.test(url) || url.includes('{bbox-epsg-3857}');
}

function validateTileUrl(url: string): string | undefined {
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
  if (!url.startsWith('https://') && !(isLocal && url.startsWith('http://'))) {
    return 'URL must start with https://';
  }
  if (isWmsUrl(url)) {
    if (!url.includes('{bbox-epsg-3857}')) {
      return 'WMS URL must include {bbox-epsg-3857} placeholder';
    }
    return;
  }
  // Accept {y} (XYZ scheme) or {-y} (TMS scheme, flipped Y axis)
  if (
    !url.includes('{z}') ||
    !url.includes('{x}') ||
    (!url.includes('{y}') && !url.includes('{-y}'))
  ) {
    return 'Must include {z}, {x}, and {y} (or {-y} for TMS) placeholders, or use a WMS URL with {bbox-epsg-3857}';
  }
}

export function RasterLayerDialog({
  modal,
  onClose
}: {
  modal: DialogStateRasterLayer;
  onClose: () => void;
}) {
  const [customRasterLayers, setCustomRasterLayers] = useAtom(
    customRasterLayersAtom
  );

  const isEditing = !!modal.editingLayer;
  const initialValues: RasterLayerFormValues = isEditing
    ? {
        name: modal.editingLayer.name,
        tileUrl: modal.editingLayer.tileUrl
      }
    : {
        name: '',
        tileUrl: ''
      };

  return (
    <>
      <DialogHeader
        title={isEditing ? 'Edit Raster Layer' : 'Add Raster Layer'}
        titleIcon={LayersIcon}
      />
      <Formik<RasterLayerFormValues>
        validate={(values) => {
          const errors: Partial<Record<keyof RasterLayerFormValues, string>> =
            {};

          if (!values.name.trim()) {
            errors.name = 'Layer name is required';
          }

          if (!values.tileUrl.trim()) {
            errors.tileUrl = 'Tile URL is required';
          } else {
            const urlError = validateTileUrl(values.tileUrl);
            if (urlError) errors.tileUrl = urlError;
          }

          return errors;
        }}
        onSubmit={function onSubmit({ name, tileUrl }) {
          if (isEditing) {
            // Update existing layer
            const updatedLayers = customRasterLayers.map((layer) =>
              layer.id === modal.editingLayer!.id
                ? { ...layer, name, tileUrl, visible: layer.visible ?? true }
                : layer
            );
            setCustomRasterLayers(updatedLayers);
            toast.success('Raster layer updated');
          } else {
            // Add new layer at the top of the stack
            const newLayer = {
              id: uuidv4(),
              name,
              tileUrl,
              order: 0,
              visible: true
            };
            // Increment order of all existing layers
            const updatedExistingLayers = customRasterLayers.map((layer) => ({
              ...layer,
              order: layer.order + 1
            }));
            setCustomRasterLayers([newLayer, ...updatedExistingLayers]);
            toast.success('Raster layer added');
          }

          onClose();
        }}
        initialValues={initialValues}
      >
        <Form>
          <div className="space-y-4">
            <LabeledTextField
              type="text"
              label="Layer Name"
              name="name"
              placeholder="My Custom Layer"
            />
            <LabeledTextField
              type="text"
              label="Tile URL template"
              name="tileUrl"
              placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
            />
            <TextWell>
              <strong>XYZ/TMS:</strong> Provide a tile URL template including{' '}
              {'{z}'}, {'{x}'}, and {'{y}'} placeholders. Use {'{-y}'} instead
              of {'{y}'} for TMS layers with a flipped Y axis (e.g. from JOSM or
              QGIS).
              <br />
              <br />
              <strong>WMS:</strong> Provide a WMS GetMap URL with{' '}
              {'{bbox-epsg-3857}'} as the BBOX parameter value. The URL must
              include <code>SERVICE=WMS</code>, <code>REQUEST=GetMap</code>,{' '}
              <code>CRS=EPSG:3857</code>, <code>WIDTH=256</code>, and{' '}
              <code>HEIGHT=256</code>.
            </TextWell>
            <TextWell>
              <strong>Note:</strong> Your raster layer configuration will be
              saved in your browser's local storage and will not be available if
              you switch browsers or clear your browsing data.
            </TextWell>
          </div>
          <SimpleDialogActions
            onClose={onClose}
            action={isEditing ? 'Update' : 'Add'}
          />
        </Form>
      </Formik>
    </>
  );
}
