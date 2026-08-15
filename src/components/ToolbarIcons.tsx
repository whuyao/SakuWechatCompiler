type ToolbarIconProps = {
  className?: string
}

const iconProps = {
  'aria-hidden': true,
  focusable: false,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
}

export const FormatPainterIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="m10.5 13.5 8.2-8.2a2.1 2.1 0 0 0-3-3l-8.2 8.2" />
    <path d="m7.5 10.5 3 3" />
    <path d="M8.8 13.2c1.8 1.8 1.3 4.9-.8 6.4-1.8 1.3-4.5 1.2-6 .3 1.7-.5 2.2-1.8 1.7-3.1-.6-1.6.2-3.5 1.8-4.2 1.1-.5 2.4-.2 3.3.6Z" />
  </svg>
)

export const UndoIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M9 7 4 12l5 5" />
    <path d="M5 12h8a7 7 0 0 1 7 7" />
  </svg>
)

export const RedoIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="m15 7 5 5-5 5" />
    <path d="M19 12h-8a7 7 0 0 0-7 7" />
  </svg>
)

export const AlignLeftIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M4 6h16M4 10h11M4 14h16M4 18h9" />
  </svg>
)

export const AlignCenterIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M4 6h16M7 10h10M4 14h16M8 18h8" />
  </svg>
)

export const AlignRightIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="M4 6h16M9 10h11M4 14h16M11 18h9" />
  </svg>
)

export const ClearFormattingIcon = ({ className }: ToolbarIconProps) => (
  <svg {...iconProps} className={className}>
    <path d="m14.7 4.3 5 5a2 2 0 0 1 0 2.8L11.8 20H7l-4-4L14.7 4.3Z" />
    <path d="m10 9 5 5M7 20h14" />
  </svg>
)
