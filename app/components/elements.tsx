import {
  EyeNoneIcon,
  EyeOpenIcon,
  QuestionMarkCircledIcon,
  SymbolIcon,
  TextIcon,
  TextNoneIcon
} from '@radix-ui/react-icons';
import classed from 'classed-components';
import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import { Field } from 'formik';
import { captureException } from 'integrations/errors';
import {
  ContextMenu as CM,
  DropdownMenu as DD,
  Dialog,
  Popover,
  Tooltip
} from 'radix-ui';
import React from 'react';

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger className="dark:text-white align-middle">
        <QuestionMarkCircledIcon />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <TContent>
          <div className="w-36">{children}</div>
        </TContent>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function StyledDropOverlay({
  children
}: React.PropsWithChildren<Record<string, unknown>>) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-500 pointer-events-none bg-opacity-75">
      <div className="px-3 py-2 text-white bg-gray-500 rounded-md max-w-36">
        {children}
      </div>
    </div>
  );
}

type ErrorData = {
  error: Error;
  componentStack: string | null;
  eventId: string | null;
  resetError(): void;
};

export function ErrorFallback(props: ErrorData) {
  return (
    <div className="max-w-xl p-4">
      <TextWell size="md">
        Sorry, an unexpected error occurred. If this keeps happening, consider
        opening a bug report issue{' '}
        <a
          href="https://github.com/mapbox/geojson.io/issues"
          className={styledInlineA}
        >
          on GitHub
        </a>
        .
      </TextWell>
      {props.resetError ? (
        <div className="pt-2">
          <Button onClick={() => props.resetError()}>Retry</Button>
        </div>
      ) : null}
    </div>
  );
}

type ErrorBoundaryProps = {
  fallback: (error: ErrorData) => React.ReactNode;
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: ErrorData | null;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureException(
      error,
      // Example "componentStack":
      //   in ComponentThatThrows (created by App)
      //   in ErrorBoundary (created by App)
      //   in div (created by App)
      //   in App
      info.componentStack
      // Warning: `captureOwnerStack` is not available in production.
      // React.captureOwnerStack(),
    );
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // You can render any custom fallback UI
      return this.props.fallback(this.state.error);
    }

    return this.props.children;
  }
}

export function DefaultErrorBoundary({
  children
}: React.PropsWithChildren<unknown>) {
  return <ErrorBoundary fallback={ErrorFallback}>{children}</ErrorBoundary>;
}

export function Loading({ size = 'sm' }: { size?: B3Size }) {
  return (
    <div
      className={clsx(
        {
          'h-32': size === 'sm',
          'h-16': size === 'xs'
        },
        `text-gray-500 flex items-center justify-center`
      )}
    >
      <SymbolIcon className="animate-spin" />
      <span className="ml-2">Loading…</span>
    </div>
  );
}

export const CapsLabel = classed.label(
  'block uppercase font-semibold text-gray-500 dark:text-gray-500 text-xs'
);

const overlayClasses =
  'fixed inset-0 bg-black/20 dark:bg-white/20 z-50 geojsonio-fadein';

export const StyledDialogOverlay = classed(Dialog.Overlay)(overlayClasses);

const styledDialogContent = ({
  size = 'sm',
  extraWide = false
}: {
  size?: B3Size;
  extraWide?: boolean;
}) =>
  clsx(
    {
      'p-4': size === 'sm',
      'p-0': size === 'xs',
      // extraWide is used by the About modal, which needs more horizontal space and no scrolling
      'sm:max-w-3xl overflow-hidden h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)]':
        extraWide,
      'sm:max-w-lg overflow-auto max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-8rem)]':
        !extraWide
    },
    `fixed inline-block w-full
      
      text-left
      align-bottom
      bg-white dark:bg-gray-900
      dark:text-white
      shadow-md dark:shadow-none dark:border dark:border-black
      sm:rounded sm:align-middle
      left-2/4 top-2/4 -translate-x-1/2 -translate-y-1/2
      z-50
      `
  );

// Accept extraWide prop, default to false
export const StyledDialogContent = classed(Dialog.Content)<{
  size?: B3Size;
  extraWide?: boolean;
}>(styledDialogContent);

export const styledCheckbox = ({
  variant = 'default'
}: {
  variant: B3Variant;
}) =>
  clsx([
    sharedOutline('primary'),
    {
      'text-mb-blue-500 focus:ring-mb-blue-500': variant === 'primary',
      'text-gray-500 border-gray-500 hover:border-gray-700 dark:hover:border-gray-300 focus:ring-gray-500':
        variant === 'default'
    },
    `bg-transparent rounded dark:ring-offset-gray-700`
  ]);

export const FieldCheckbox = classed(Field)(styledCheckbox);

export const TContent = classed(Tooltip.Content)(
  ({ size = 'sm' }: { size?: B3Size }) => [
    {
      'max-w-md': size === 'sm',
      'w-64': size === 'md'
    },
    `px-2 py-1 rounded
  z-50
  text-sm
  border
  shadow-sm
  text-gray-700          dark:text-white
  bg-white               dark:bg-gray-900
  border-gray-200        dark:border-gray-600
  `
  ]
);

export function styledPropertyInput(
  side: 'left' | 'right' | 'table',
  missing = false
) {
  return clsx(
    {
      'pl-3': side === 'left',
      'pl-2': side === 'right',
      'px-2': side === 'table'
    },
    missing
      ? 'text-gray-700 dark:text-gray-100 opacity-70'
      : 'text-gray-700 dark:text-gray-100',
    `bg-transparent block tabular-nums text-xs border-none pr-1 py-2
    w-full
    focus-visible:ring-inset
    focus-visible:bg-mb-blue-300/10 dark:focus-visible:bg-mb-blue-700/40
    dark:focus-visible:ring-mb-blue-700 focus-visible:ring-mb-blue-500`
  );
}

export const styledTd = 'border-gray-200 dark:border-gray-600';

const arrowLike = 'text-white dark:text-gray-900 fill-current';

const ArrowSVG = (
  <svg>
    <polygon points="0,0 30,0 15,10" />
    <path
      d="M 0 0 L 15 10 L 30 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="text-gray-200 dark:text-gray-600"
    />
  </svg>
);

export const StyledPopoverArrow = () => (
  <Popover.Arrow offset={5} width={11} height={5} className={arrowLike} asChild>
    {ArrowSVG}
  </Popover.Arrow>
);

export const StyledTooltipArrow = () => (
  <Tooltip.Arrow offset={5} width={11} height={5} className={arrowLike} asChild>
    {ArrowSVG}
  </Tooltip.Arrow>
);

export const StyledPopoverContent = classed(Popover.Content)(
  ({
    size = 'sm',
    flush = 'no'
  }: {
    size?: B3Size | 'no-width';
    flush?: 'yes' | 'no';
  }) =>
    clsx(
      {
        'w-32': size === 'xs',
        'w-64': size === 'sm',
        'w-96': size === 'md',
        'w-[36em]': size === 'lg'
      },
      flush === 'yes' ? '' : 'p-3',
      `shadow-lg
      geojsonio-appear
      z-50
      bg-white dark:bg-gray-900
      dark:text-white
      border border-gray-200 dark:border-gray-700 rounded-md`
    )
);

export function PopoverContent2({
  children,
  ...props
}: React.ComponentProps<typeof StyledPopoverContent>) {
  return (
    <Popover.Portal>
      <StyledPopoverContent {...props}>
        <StyledPopoverArrow />
        {children}
      </StyledPopoverContent>
    </Popover.Portal>
  );
}

export const styledTextarea =
  'block w-full mt-1 text-sm font-mono border-gray-300 dark:bg-transparent dark:text-white rounded-sm focus-visible:border-gray-300 overflow-auto focus:ring-mb-blue-500';

export const StyledFieldTextareaCode = classed(Field)(styledTextarea);

export const StyledLabelSpan = classed.span(
  ({ size = 'sm' }: { size?: B3Size }) =>
    clsx(
      {
        'text-sm': size === 'sm',
        'text-xs': size === 'xs'
      },
      'text-gray-700 dark:text-gray-300 select-none'
    )
);

export const contentLike = `py-1
    bg-white dark:bg-gray-900
    rounded-sm
    shadow-[0_2px_10px_2px_rgba(0,0,0,0.1)]
    ring-1 ring-gray-200 dark:ring-gray-700
    content-layout z-50`;

export const DDContent = classed(DD.Content)(contentLike);
export const CMContent = classed(CM.Content)(contentLike);
export const CMSubContent = classed(CM.SubContent)(contentLike);

const styledLabel =
  'block py-1 pl-3 pr-4 text-xs text-gray-500 dark:text-gray-300';

export const DivLabel = classed.div(styledLabel);
export const DDLabel = classed(DD.Label)(styledLabel);

const styledSeparator = 'border-t border-gray-100 dark:border-gray-700 my-1';

export const DivSeparator = classed.div(styledSeparator);
export const DDSeparator = classed(DD.Separator)(styledSeparator);

export const styledInlineA =
  'text-mb-blue-700 underline hover:text-black dark:text-mb-blue-500 dark:hover:text-mb-blue-300';

export const menuItemLike = ({
  variant = 'default'
}: {
  variant?: B3Variant;
}) =>
  clsx([
    {
      'text-black dark:text-gray-300': variant === 'default',
      'text-red-500 dark:text-red-300': variant === 'destructive'
    },
    `cursor-pointer
    hover:bg-gray-200 dark:hover:bg-gray-700
    focus-visible:bg-gray-100 dark:focus-visible:bg-gray-700
    flex items-center
    w-full
    py-1 pl-3 pr-3
    text-sm gap-x-2`
  ]);

export const StyledItem = classed(DD.Item)(menuItemLike);
export const DDSubTriggerItem = classed(DD.SubTrigger)(menuItemLike);
export const CMSubTriggerItem = classed(CM.SubTrigger)(
  `${menuItemLike({ variant: 'default' })} justify-between`
);
export const CMItem = classed(CM.Item)(menuItemLike);

export const PopoverTitleAndClose = ({ title }: { title: string }) => (
  <div className="flex items-start justify-between pb-2">
    <StyledLabelSpan>{title}</StyledLabelSpan>
  </div>
);

export type B3Size = 'xxs' | 'xs' | 'sm' | 'md' | 'lg';
export type B3Variant =
  | 'default'
  | 'primary'
  | 'quiet'
  | 'code'
  | 'quiet/mode'
  | 'destructive';
type B3Side = 'default' | 'left' | 'right' | 'middle';

export const sharedPadding = (
  size: B3Size,
  side: B3Side = 'default'
): ClassValue => ({
  'p-0 text-xs rounded-sm': size === 'xxs',
  'py-0.5 px-1.5 text-xs rounded-sm': size === 'xs',
  'py-1 px-2 text-sm rounded': size === 'sm',
  'py-1 px-3 text-md rounded': size === 'md',
  'rounded-l-none': side === 'right',
  'rounded-r-none': side === 'left',
  'rounded-none': side === 'middle'
});

export const styledRadio = clsx(
  'text-mb-blue-500 dark:bg-transparent dark:checked:bg-mb-blue-300 focus:ring-mb-blue-500',
  sharedOutline('primary')
);

/**
 * Shared by select and buttons
 */
export function sharedOutline(
  variant: B3Variant,
  disabled = false
): ClassValue {
  return [
    `
    outline-none

  `,
    disabled
      ? ''
      : `focus-visible:ring-1
    focus-visible:ring-offset-1
    focus-visible:ring-mb-blue-500
    dark:focus-visible:ring-mb-blue-500
    dark:focus-visible:ring-offset-gray-900`,

    {
      'border border-mb-blue-500': variant === 'primary',
      [`border
    border-gray-200               dark:border-gray-500
    shadow-sm
  `]: variant === 'default',

      [`
    focus-visible:border-gray-200   dark:focus-visible:border-gray-300
    hover:border-gray-300   dark:hover:border-gray-300
    `]: variant === 'default' && !disabled,

      [`border
    border-red-200               dark:border-red-300
  `]: variant === 'destructive',

      [`
    focus-visible:border-red-500   dark:focus-visible:border-red-300
    hover:border-red-300   dark:hover:border-red-300
  `]: variant === 'destructive' && !disabled
    }
  ];
}

const sharedBackground = (variant: B3Variant, disabled = false): ClassValue => {
  switch (variant) {
    case 'primary':
    case 'code':
      return [
        `bg-mb-blue-300`,
        !disabled && `hover:bg-mb-blue-500 dark:hover:bg-blue-500 hover:shadow`
      ];
    case 'default':
      return !disabled && `hover:bg-gray-100 dark:hover:bg-gray-800`;
    case 'quiet':
      return !disabled && `hover:bg-gray-200 dark:hover:bg-gray-700`;
    case 'quiet/mode':
      return !disabled && `hover:bg-gray-200 dark:hover:bg-gray-700`;
    case 'destructive':
      return !disabled && `hover:bg-red-500/10 dark:hover:bg-red-500/20`;
  }
};

const sharedText = (variant: B3Variant): ClassValue => {
  switch (variant) {
    case 'quiet':
    case 'code':
    case 'quiet/mode':
    case 'default': {
      return 'font-medium text-gray-700 dark:text-white';
    }
    case 'primary': {
      return 'font-medium text-white';
    }
    case 'destructive': {
      return 'font-medium text-red-500 dark:text-red-300';
    }
  }
};

export const styledButton = ({
  size = 'sm',
  variant = 'default',
  disabled = false,
  side = 'default'
}: {
  size?: B3Size | 'full-width';
  variant?: B3Variant;
  disabled?: boolean;
  side?: B3Side;
}) =>
  clsx(
    variant === 'quiet/mode'
      ? `aria-expanded:bg-mb-blue-300 aria-expanded:text-white
      dark:aria-expanded:bg-mb-blue-300
    data-state-on:bg-purple-400 dark:data-state-on:bg-gray-900`
      : variant === 'primary'
      ? `aria-expanded:bg-mb-blue-300
    data-state-on:bg-mb-blue-300`
      : `
    aria-expanded:bg-gray-200 dark:aria-expanded:bg-black
    data-state-on:bg-gray-200 dark:data-state-on:bg-gray-600`,
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'transition-colors',
    // Focus
    `focus-visible:outline-none`,
    // Sizing
    sharedPadding(size === 'full-width' ? 'md' : size, side),
    // Display
    `inline-flex items-center gap-x-1`,
    // Transition
    // `transition-all`,
    // Text
    sharedText(variant),
    // Outline
    sharedOutline(variant, disabled),
    sharedBackground(variant, disabled),
    size === 'full-width' && 'flex-auto justify-center',
    // Colored variants
    {}
  );

export const styledPanelTitle = ({
  interactive = false
}: {
  interactive?: boolean;
}) =>
  clsx(
    `text-sm
  w-full
  text-gray-700 dark:text-gray-300
  flex justify-between items-center`,
    'px-3 py-3',
    interactive && `hover:text-gray-900 dark:hover:text-white`
  );

export const Button = classed.button(styledButton);

// TODO: all kinds of issues with select. Change to styled soon.
export const styledSelect = ({
  size,
  variant = 'default'
}: {
  size: B3Size;
  variant?: B3Variant;
}) =>
  clsx([
    sharedPadding(size),
    sharedOutline(variant),
    sharedText('default'),
    `
    pr-8
    bg-transparent

    focus-visible:bg-white
    active:bg-white

    dark:focus-visible:bg-black
    dark:active:bg-black
    `
  ]);

export const inputClass = ({
  _size = 'sm',
  variant = 'default'
}: {
  _size?: B3Size;
  variant?: B3Variant;
}) =>
  clsx([
    sharedPadding(_size),
    sharedOutline('default'),
    {
      'font-mono': variant === 'code'
    },
    `block w-full
    dark:bg-transparent dark:text-gray-100`
  ]);

export const Keycap = classed.span(({ size = 'sm' }: { size?: B3Size }) => [
  {
    'text-sm px-2': size === 'sm',
    'text-xs px-1': size === 'xs'
  },
  `inline-flex items-center justify-center
  font-mono rounded
  ring-1 ring-gray-100 dark:ring-black
  border border-b-4 border-r-2
  border-gray-300 dark:border-gray-500
  bg-white dark:bg-gray-700/50
  min-w-0 w-auto h-auto
  p-0
  align-middle
  whitespace-nowrap
  `
]);

export const Input = classed.input(inputClass);
export const StyledField = classed(Field)(inputClass);

export const TextWell = classed.div(
  ({
    size = 'sm',
    variant = 'default'
  }: {
    size?: B3Size;
    variant?: B3Variant;
  }) =>
    clsx({
      'text-sm': size === 'sm',
      'py-2 px-3':
        (variant === 'destructive' || variant === 'primary') && size === 'sm',
      'py-1 px-2':
        (variant === 'destructive' || variant === 'primary') && size === 'xs',
      'text-xs': size === 'xs',
      'text-gray-700 dark:text-gray-300': variant === 'default',
      'text-red-700 dark:text-red-100 bg-red-50 dark:bg-red-900 rounded':
        variant === 'destructive',
      'bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded':
        variant === 'primary'
    })
);

export const StyledPopoverTrigger = classed(Popover.Trigger)(
  clsx(
    `aria-expanded:bg-gray-200 dark:aria-expanded:bg-gray-900
    data-state-on:bg-gray-200 dark:data-state-on:bg-gray-600`,
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Focus
    `focus-visible:outline-none`,
    // Sizing
    `py-1 px-1 rounded text-sm`,
    // Display
    `relative w-full flex items-center gap-x-1`,
    // Transition
    // `transition-all`,
    // Text
    sharedText('default'),
    // Outline
    sharedOutline('default', false),
    sharedBackground('default', false),
    // Colored variants
    {}
  )
);

export const VisibilityToggleIcon = ({
  visibility
}: {
  visibility: boolean;
}) => {
  return visibility ? <EyeOpenIcon /> : <EyeNoneIcon />;
};

export const LabelToggleIcon = ({ visibility }: { visibility: boolean }) => {
  return visibility ? <TextIcon /> : <TextNoneIcon />;
};
