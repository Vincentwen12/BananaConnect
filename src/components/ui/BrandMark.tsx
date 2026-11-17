export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <span
      className="brand__mark"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }}
      aria-hidden="true"
    >
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24">
        <path d="M12 2.6 21 7.1 12 11.6 3 7.1Z" fill="#6b5300" />
        <path d="M3 7.1 12 11.6v9.8L3 16.9Z" fill="#3d3000" />
        <path d="M21 7.1 12 11.6v9.8l9-4.5Z" fill="#2b2200" />
      </svg>
    </span>
  );
}
