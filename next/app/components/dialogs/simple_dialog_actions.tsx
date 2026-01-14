import { SymbolIcon } from '@radix-ui/react-icons';
import { Button } from 'app/components/elements';
import clsx from 'clsx';
import { useFormikContext } from 'formik';

export default function SimpleDialogActions({
  action,
  onClose,
  fullWidthSubmit = false,
  secondary,
  variant = 'md'
}: {
  action?: string;
  onClose?: () => void;
  fullWidthSubmit?: boolean;
  secondary?: {
    action: string;
    onClick: () => void;
  };
  variant?: 'md' | 'xs';
}) {
  const { isSubmitting } = useFormikContext();
  return (
    <div
      className={clsx(
        variant === 'xs' ? 'pt-2' : 'pt-6',
        'pb-1 relative',
        fullWidthSubmit
          ? 'flex items-stretch justify-stretch'
          : `pb-1 flex flex-col sm:items-center sm:flex-row-reverse space-y-2 sm:space-y-0 sm:gap-x-3`
      )}
    >
      {action ? (
        <Button
          type="submit"
          disabled={isSubmitting}
          variant="primary"
          size={fullWidthSubmit ? 'full-width' : 'sm'}
        >
          {action}
        </Button>
      ) : null}
      {secondary ? (
        <Button
          type="button"
          disabled={isSubmitting}
          variant="default"
          onClick={secondary.onClick}
        >
          {secondary.action}
        </Button>
      ) : null}
      {onClose ? (
        <Button type="button" onClick={onClose}>
          Cancel
        </Button>
      ) : null}
      <SymbolIcon
        className={clsx(
          'animate-spin transition-opacity',
          isSubmitting ? 'opacity-50' : 'opacity-0',
          fullWidthSubmit && 'absolute top-8 right-2.5 text-white'
        )}
      />
    </div>
  );
}
