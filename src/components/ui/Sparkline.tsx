interface SparklineProps {
  values: number[];
}

const WIDTH = 200;
const HEIGHT = 30;

export function Sparkline({ values }: SparklineProps) {
  const data = values.length ? values : [0];
  const max = Math.max(1, ...data);
  const step = data.length > 1 ? WIDTH / (data.length - 1) : WIDTH;
  const points = data
    .map((value, index) => {
      const x = index * step;
      const y = HEIGHT - 2 - (value / max) * (HEIGHT - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg className="sparkline" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true">
      <polygon
        points={`0,${HEIGHT} ${points} ${WIDTH},${HEIGHT}`}
        fill="color-mix(in srgb, var(--accent) 24%, transparent)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent-ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
