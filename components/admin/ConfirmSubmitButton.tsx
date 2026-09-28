'use client'

import type { CSSProperties, ReactNode } from 'react'

type Props = {
  children: ReactNode
  message: string
  className?: string
  style?: CSSProperties
  disabled?: boolean
}

export default function ConfirmSubmitButton({
  children,
  message,
  className,
  style,
  disabled = false,
}: Props) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={disabled}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault()
        }
      }}
    >
      {children}
    </button>
  )
}
