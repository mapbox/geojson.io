import {
  Button,
  inputClass,
  StyledField,
  StyledLabelSpan
} from 'app/components/elements';
import { usePersistence } from 'app/lib/persistence/context';
import { Form, Formik } from 'formik';
import toast from 'react-hot-toast';
import type { IWrappedFeature } from 'types';
import * as E from 'app/components/elements';

export function FeatureEditorId({
  wrappedFeature
}: {
  wrappedFeature: IWrappedFeature;
}) {
  const rep = usePersistence();
  const transact = rep.useTransact();

  return (
    <div className="p-4">
      <div
        className="contain-layout grid gap-x-2 gap-y-2 items-center"
        style={{
          gridTemplateColumns: 'min-content 1fr'
        }}
      >
        <StyledLabelSpan size="xs">User</StyledLabelSpan>
        <div className="flex items-stretch">
          <Formik
            enableReinitialize
            key={wrappedFeature.feature.id}
            initialValues={{ id: wrappedFeature.feature.id || '' }}
            onSubmit={async (values, actions) => {
              if (values.id === undefined) {
                return;
              }
              const id =
                values.id === ''
                  ? undefined
                  : Number.isNaN(+values.id)
                  ? values.id
                  : +values.id;
              await transact({
                note: 'Updated a feature’s id',
                putFeatures: [
                  {
                    ...wrappedFeature,
                    feature: {
                      ...wrappedFeature.feature,
                      id
                    }
                  }
                ]
              });
              actions.resetForm();
              toast.success('Updated feature ID');
            }}
          >
            <Form className="flex-auto flex items-center gap-x-2">
              <StyledField
                name="id"
                spellCheck="false"
                variant="code"
                type="text"
                _size="xs"
                aria-label="ID"
              />
              <Button type="submit" size="xs">
                Update
              </Button>
            </Form>
          </Formik>
        </div>
        <StyledLabelSpan size="xs">System</StyledLabelSpan>
        <input
          type="text"
          className={inputClass({ _size: 'xs', variant: 'code' })}
          value={wrappedFeature.id}
          readOnly
          aria-label="System ID"
        />
      </div>
      <div className="pt-2">
        <E.TextWell>
          System ID is assigned by the application, cannot be changed, and is
          not exported. User ID is the Feature's top-level <code>id</code>{' '}
          property and will remain in place when exporting data.
        </E.TextWell>
      </div>
    </div>
  );
}
