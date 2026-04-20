import { LayersIcon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import SimpleDialogActions from 'app/components/dialogs/simple_dialog_actions';
import { TextWell } from 'app/components/elements';
import { InlineError } from 'app/components/inline_error';
import { LabeledTextField } from 'app/core/components/LabeledTextField';
import { Form, Formik } from 'formik';
import { useAtom } from 'jotai';
import { useState } from 'react';
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
  const [formError, setFormError] = useState<string | null>(null);

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
        onSubmit={function onSubmit({ name, tileUrl }) {
          setFormError(null);

          // Validate name
          if (!name.trim()) {
            setFormError('Please provide a name for the layer.');
            return;
          }

          // Validate tile URL
          if (!tileUrl.trim()) {
            setFormError('Please provide a tile URL.');
            return;
          }

          if (!validateTileUrl(tileUrl)) {
            setFormError(
              'Tile URL must include {z}, {x}, and {y} placeholders.'
            );
            return;
          }

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
            // Add new layer
            const newLayer = {
              id: uuidv4(),
              name,
              tileUrl,
              order: customRasterLayers.length,
              visible: true
            };
            setCustomRasterLayers([...customRasterLayers, newLayer]);
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
              label="Tile URL"
              name="tileUrl"
              placeholder="https://example.com/tiles/{z}/{x}/{y}.png"
            />
            {formError && <InlineError>{formError}</InlineError>}
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
