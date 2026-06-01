import { Pencil1Icon } from '@radix-ui/react-icons';
import { DialogHeader } from 'app/components/dialog';
import SimpleDialogActions from 'app/components/dialogs/simple_dialog_actions';
import { styledSelect } from 'app/components/elements';
import { castExplicit, ExplicitCast } from 'app/lib/cast';
import { usePersistence } from 'app/lib/persistence/context';
import { useFeatureMap } from 'app/lib/persistence/shared';
import { Field, Form, Formik } from 'formik';
import type { ModalStateCastProperty } from 'state/jotai';
import type { JsonObject } from 'type-fest';

type CastFormValues = {
  castTarget: ExplicitCast;
};

const CAST_TARGET_DOCS: Record<ExplicitCast, React.ReactNode> = {
  [ExplicitCast.Number]: (
    <>
      Casting to a number will apply the + operator to each value, which will
      parse most kinds of numbers.
    </>
  ),
  [ExplicitCast.Boolean]: `Casting to a boolean will transform zero values, null values, empty strings, and strings that are
      equal to "false" to false, and transform everything else to true.`,
  [ExplicitCast.HTML]: `Casting to rich text will reinterpret the given values to be compatible with geojson.io’s
      rich text editor.`,
  [ExplicitCast.JSON]: `Useful only in very peculiar scenarios, this will parse all string values
      of this property into JSON objects, if they can be parsed.`,
  [ExplicitCast.String]: `This will reinterpret all other values as strings: for example,
      a value of 100 will become a string "100", rather than the number 100.`
};

export function CastPropertyDialog({
  onClose,
  modal
}: {
  onClose: () => void;
  modal: ModalStateCastProperty;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();
  const featureMap = useFeatureMap();

  const onSubmit = async (values: CastFormValues) => {
    await transact({
      track: 'feature-cast-property',
      putFeatures: Array.from(featureMap.values(), (wrappedFeature) => {
        const oldProperties = wrappedFeature.feature.properties;
        const properties = { ...oldProperties } as JsonObject;
        properties[modal.column] = castExplicit(
          properties[modal.column],
          values.castTarget
        );
        const newFeature = {
          ...wrappedFeature.feature,
          properties
        };
        return {
          ...wrappedFeature,
          feature: newFeature
        };
      })
    });
    onClose();
  };

  return (
    <>
      <DialogHeader title="Cast property" titleIcon={Pencil1Icon} />
      <Formik
        onSubmit={onSubmit}
        initialValues={{
          castTarget: ExplicitCast.Number
        }}
      >
        <Form>
          <div className="space-y-4">
            <div>
              You are casting the property{' '}
              <code className="bg-purple-100 bg-opacity-10 p-1">
                {modal.column}
              </code>
              , for all features. This will change the property’s type from a
              string to another type.
            </div>
            <Field
              as="select"
              name="castTarget"
              className={`${styledSelect({ size: 'md' })} w-full`}
            >
              {Object.values(ExplicitCast).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>
            <div>
              <Field name="castTarget">
                {({
                  field: { value }
                }: {
                  field: {
                    value: ExplicitCast;
                  };
                }) => <div>{CAST_TARGET_DOCS[value]}</div>}
              </Field>
            </div>
          </div>
          <SimpleDialogActions onClose={onClose} action="Cast" />
        </Form>
      </Formik>
    </>
  );
}
