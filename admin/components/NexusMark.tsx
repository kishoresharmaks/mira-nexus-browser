export function NexusMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="mark-ring" cx="12" cy="12" r="8.4" />
      <circle className="mark-dot" cx="17.94" cy="6.06" r="2.2" />
    </svg>
  );
}
