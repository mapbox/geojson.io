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

function validateTileUrl(url: string): boolean {
  // Check if the URL contains {z}, {x}, and {y} placeholders
  return url.includes('{z}') && url.includes('{x}') && url.includes('{y}');
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
          } else if (!validateTileUrl(values.tileUrl)) {
            errors.tileUrl = 'Must include {z}, {x}, and {y} placeholders';
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
              Provide a tile URL template with {'{z}'}, {'{x}'}, and {'{y}'}{' '}
              placeholders for zoom level and tile coordinates.
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
