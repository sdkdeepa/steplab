export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect x="3" y="20" width="10" height="9" rx="2" fill="currentColor" opacity=".35" />
      <rect x="11" y="12" width="10" height="17" rx="2" fill="currentColor" opacity=".65" />
      <rect x="19" y="3" width="10" height="26" rx="2" fill="#e8251a" />
    </svg>
  )
}
