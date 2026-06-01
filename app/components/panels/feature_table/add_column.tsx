import { PlusIcon } from '@radix-ui/react-icons';
import {
  Button,
  PopoverTitleAndClose,
  StyledField,
  StyledPopoverArrow,
  StyledPopoverContent
} from 'app/components/elements';
import { Form, Formik } from 'formik';
import { Popover as P } from 'radix-ui';
import type React from 'react';
import { useState } from 'react';

export default function AddColumn({
  onAddColumn,
  ...props
}: {
  onAddColumn: (arg0: string) => void;
} & React.HTMLAttributes<HTMLButtonElement>) {
  const [open, setOpen] = useState<boolean>(false);
  return (
    <P.Root open={open} onOpenChange={(open) => setOpen(open)}>
      <P.Trigger title="Add column" {...props}>
        <PlusIcon />
      </P.Trigger>
      <StyledPopoverContent>
        <StyledPopoverArrow />
        <PopoverTitleAndClose title="Add column" />
        <Formik
          initialValues={{ name: '' }}
          onSubmit={(values, actions) => {
            onAddColumn(values.name);
            actions.resetForm();
            setOpen(false);
          }}
        >
          <Form className="flex items-center gap-x-2">
            <StyledField
              name="name"
              type="text"
              required
              _size="xs"
              innerRef={(elem: HTMLInputElement) => {
                if (elem) {
                  setTimeout(() => {
                    elem.focus();
                  }, 0);
                }
              }}
            />
            <Button size="xs">Add</Button>
          </Form>
        </Formik>
      </StyledPopoverContent>
    </P.Root>
  );
}
