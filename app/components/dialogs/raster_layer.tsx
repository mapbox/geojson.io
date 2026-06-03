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

function validateTileUrl(url: string): string | undefined {
  if (!url.startsWith('https://')) return 'URL must start with https://';
  // Accept {y} (XYZ scheme) or {-y} (TMS scheme, flipped Y axis)
  if (
    !url.includes('{z}') ||
    !url.includes('{x}') ||
    (!url.includes('{y}') && !url.includes('{-y}'))
  ) {
    return 'Must include {z}, {x}, and {y} (or {-y} for TMS) placeholders';
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
              Provide a tile URL template starting with https:// and including{' '}
              {'{z}'}, {'{x}'}, and {'{y}'} placeholders for zoom level and tile
              coordinates. Use {'{-y}'} instead of {'{y}'} for TMS layers with a
              flipped Y axis (e.g. from JOSM or QGIS).
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
