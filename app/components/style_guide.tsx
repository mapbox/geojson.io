import { Cross1Icon } from '@radix-ui/react-icons';
import { ToolbarTrigger } from 'app/components/context_actions';
import { InlineError } from 'app/components/inline_error';
import { Form, Formik } from 'formik';
import { Dialog as D, DropdownMenu as DD, Tooltip } from 'radix-ui';
import { Fragment } from 'react';
import { DialogHeader } from './dialog';
import SimpleDialogActions from './dialogs/simple_dialog_actions';
import {
  type B3Size,
  type B3Variant,
  Button,
  CapsLabel,
  ErrorFallback,
  FieldCheckbox,
  Input,
  Loading,
  StyledDialogContent,
  StyledDialogOverlay,
  StyledTooltipArrow,
  styledButton,
  styledInlineA,
  styledRadio,
  styledSelect,
  TContent
} from './elements';
import MenuAction from './menu_action';

function StyleGuideSection({
  title,
  children
}: React.PropsWithChildren<{ title: string }>) {
  return (
    <div className="space-y-2 p-4">
      <h4 className="font-bold opacity-50 text-xs">{title}</h4>
      <div>{children}</div>
    </div>
  );
}

export function StyleGuide() {
  const sizes: B3Size[] = ['xs', 'sm', 'md'];
  const variants: B3Variant[] = ['default', 'primary', 'destructive'];
  return (
    <div>
      {['dark bg-gray-800 text-white', ''].map((dark) => (
        <div key={dark} className={dark}>
          <div className="divide-y divide-gray-200">
            <StyleGuideSection title="Error trigger">
              <Button
                onClick={() => {
                  throw new Error('test');
                }}
              >
                Test
              </Button>
            </StyleGuideSection>
            <StyleGuideSection title="Button">
              {[true, false].map((disabled) => {
                return (
                  <div className="space-y-2" key={disabled.toString()}>
                    {variants.map((variant) => {
                      return (
                        <div className="space-y-2" key={variant}>
                          {sizes.map((size) => {
                            return (
                              <Fragment key={size}>
                                <Button
                                  disabled={disabled}
                                  key={size + variant}
                                  size={size}
                                  variant={variant}
                                >
                                  {size} / {variant}
                                </Button>{' '}
                              </Fragment>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </StyleGuideSection>
            <StyleGuideSection title="Inputs">
              <Input type="text" placeholder="Input" />
            </StyleGuideSection>
            <StyleGuideSection title="CapsLabel">
              <CapsLabel>Foo</CapsLabel>
            </StyleGuideSection>
            <StyleGuideSection title="Inline error">
              <InlineError>Test error content</InlineError>
            </StyleGuideSection>
            <StyleGuideSection title="Simple Dialog actions">
              <Formik initialValues={{}} onSubmit={() => {}}>
                <SimpleDialogActions onClose={() => {}} action="Do the thing" />
              </Formik>
            </StyleGuideSection>
            <StyleGuideSection title="Checkbox">
              <Formik initialValues={{ y: false, x: true }} onSubmit={() => {}}>
                <Form className="flex items-center gap-x-2">
                  <FieldCheckbox name="x" type="checkbox" /> Checkbox!
                  <FieldCheckbox name="y" type="checkbox" /> Checkbox!
                </Form>
              </Formik>
            </StyleGuideSection>
            <StyleGuideSection title="Loading">
              <Loading />
            </StyleGuideSection>
            <StyleGuideSection title="Loading xs">
              <Loading size="xs" />
            </StyleGuideSection>
            <StyleGuideSection title="Select + action">
              {sizes.map((size) => (
                <div key={size} className="flex items-center gap-x-2 pt-4">
                  <select className={styledSelect({ size })}>
                    <option>Foo</option>
                    <option>X</option>
                  </select>
                  <Button size={size}>Do it</Button>
                </div>
              ))}
            </StyleGuideSection>
            <StyleGuideSection title="Menu elements">
              <div className="flex gap-x-2 items-center">
                <DD.Root>
                  <Tooltip.Root>
                    <ToolbarTrigger>
                      <Cross1Icon />
                    </ToolbarTrigger>
                  </Tooltip.Root>
                </DD.Root>
                <MenuAction onClick={() => {}} label="Example">
                  <Cross1Icon />
                </MenuAction>
              </div>
            </StyleGuideSection>
            <StyleGuideSection title="Inline link">
              <div className="flex items-center gap-x-2">
                <input type="radio" name="x" className={styledRadio} />
                Radio button
                <input
                  type="radio"
                  value="y"
                  name="x"
                  className={styledRadio}
                />
                Radio button
              </div>
            </StyleGuideSection>

            <StyleGuideSection title="Dialog">
              <div>
                <D.Root>
                  <D.Trigger className={styledButton({})}>Dialog</D.Trigger>
                  <D.Portal>
                    <StyledDialogOverlay />
                    <StyledDialogContent>
                      <DialogHeader titleIcon={Cross1Icon} title="Test" />
                      <Formik
                        initialValues={{ y: false, x: true }}
                        onSubmit={() => {}}
                      >
                        <Form>
                          <div>
                            Test
                            <SimpleDialogActions
                              action="Do it"
                              onClose={() => {}}
                            />
                          </div>
                        </Form>
                      </Formik>
                    </StyledDialogContent>
                  </D.Portal>
                </D.Root>
              </div>
            </StyleGuideSection>

            <StyleGuideSection title="Error fallback">
              <div>
                <ErrorFallback
                  error={new Error()}
                  resetError={() => {}}
                  componentStack="x"
                  eventId="xxx"
                />
              </div>
            </StyleGuideSection>

            <StyleGuideSection title="Inline link">
              <div>
                This is text with a{' '}
                <a href="#" className={styledInlineA}>
                  link in the middle
                </a>
                .
              </div>
            </StyleGuideSection>
            <StyleGuideSection title="Tooltip">
              <Tooltip.Root>
                <Tooltip.Trigger
                  aria-label="Show panel"
                  className="p-2 trigger"
                >
                  Tooltip
                </Tooltip.Trigger>
                <TContent>
                  <StyledTooltipArrow />
                  <div className="whitespace-nowrap">Expand panel</div>
                </TContent>
              </Tooltip.Root>
            </StyleGuideSection>
          </div>
        </div>
      ))}
    </div>
  );
}
