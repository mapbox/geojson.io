import BufferDialog from 'app/components/dialogs/buffer';
import { CastPropertyDialog } from 'app/components/dialogs/cast_property';
import { CircleDialog } from 'app/components/dialogs/circle';
import { CircleTypesDialog } from 'app/components/dialogs/circle_types';
import { ExportDialog } from 'app/components/dialogs/export';
import { ImportDialog } from 'app/components/dialogs/import';
import { ImportNotesDialog } from 'app/components/dialogs/import_notes';
import { ImportURLDialog } from 'app/components/dialogs/import_url';
import { QuickswitcherDialog } from 'app/components/search/quickswitcher';
import SimplifyDialog from 'app/components/dialogs/simplify';
import AboutModal from 'app/components/about_modal';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAtom } from 'jotai';
import { Dialog as D } from 'radix-ui';
import { memo, Suspense, useCallback } from 'react';
import { dialogAtom } from 'state/jotai';
import { match } from 'ts-pattern';
import {
  type B3Size,
  DefaultErrorBoundary,
  Loading,
  StyledDialogContent,
  StyledDialogOverlay
} from './elements';

export const Dialogs = memo(function Dialogs() {
  const [dialog, setDialogState] = useAtom(dialogAtom);

  const onClose = useCallback(() => {
    setDialogState(null);
  }, [setDialogState]);

  let dialogSize: B3Size = 'sm';
  let extraWide: boolean = false;

  const content = match(dialog)
    .with(null, () => null)
    .with({ type: 'import' }, (modal) => (
      <ImportDialog modal={modal} onClose={onClose} />
    ))
    .with({ type: 'import_notes' }, (modal) => (
      <ImportNotesDialog modal={modal} onClose={onClose} />
    ))
    .with({ type: 'export' }, () => <ExportDialog onClose={onClose} />)
    .with({ type: 'quickswitcher' }, () => {
      dialogSize = 'xs';
      return <QuickswitcherDialog onClose={onClose} />;
    })
    .with({ type: 'cast_property' }, (modal) => (
      <CastPropertyDialog modal={modal} onClose={onClose} />
    ))
    .with({ type: 'circle_types' }, () => <CircleTypesDialog />)
    .with({ type: 'circle' }, (modal) => (
      <CircleDialog modal={modal} onClose={onClose} />
    ))
    .with({ type: 'simplify' }, (modal) => (
      <SimplifyDialog onClose={onClose} modal={modal} />
    ))
    .with({ type: 'buffer' }, (modal) => (
      <BufferDialog onClose={onClose} modal={modal} />
    ))
    .with({ type: 'from_url' }, () => <ImportURLDialog onClose={onClose} />)
    .with({ type: 'about' }, () => {
      extraWide = true;
      return <AboutModal open={true} />;
    })
    .exhaustive();

  return (
    <D.Root
      open={!!content}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      {/** Weird things happening here. Without this trigger, radix will
      return focus to the body element, which will not receive events. */}
      <D.Trigger className="hidden">
        <div className="hidden"></div>
      </D.Trigger>
      <D.Portal>
        {dialog?.type !== 'circle' ? <StyledDialogOverlay /> : null}
        <Suspense fallback={<Loading />}>
          <StyledDialogContent
            onOpenAutoFocus={(e) => e.preventDefault()}
            size={dialogSize}
            extraWide={extraWide}
          >
            <VisuallyHidden>
              <D.Title>{dialog?.title}</D.Title>
              <D.Description>{dialog?.description}</D.Description>
            </VisuallyHidden>
            <DefaultErrorBoundary>{content}</DefaultErrorBoundary>
          </StyledDialogContent>
        </Suspense>
      </D.Portal>
    </D.Root>
  );
});
