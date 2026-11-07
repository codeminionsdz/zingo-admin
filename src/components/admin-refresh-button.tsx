"use client";

import { useFormStatus } from "react-dom";

type AdminRefreshButtonProps = {
  ariaLabel?: string;
  className: string;
  label: string;
  pendingLabel: string;
  showIcon?: boolean;
};

export function AdminRefreshButton({
  ariaLabel,
  className,
  label,
  pendingLabel,
  showIcon = false,
}: AdminRefreshButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label={ariaLabel}
      aria-busy={pending}
      className={className}
      disabled={pending}
      type="submit"
    >
      {showIcon && (
        <svg
          aria-hidden="true"
          fill="none"
          height="17"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          width="17"
        >
          <path d="M20 7v5h-5M4 17v-5h5" />
          <path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" />
        </svg>
      )}
      <span>{pending ? pendingLabel : label}</span>
    </button>
  );
}
