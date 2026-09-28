'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useFormStatus } from 'react-dom'

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
  const { pending } = useFormStatus()
  const isDisabled = disabled || pending

  return (
    <button
      type="submit"
      className={className}
      style={style}
      disabled={isDisabled}
      aria-busy={pending || undefined}
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
