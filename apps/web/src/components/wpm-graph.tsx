"use client";

export function WpmGraph({ values }: { values: number[] }) {
  if (values.length < 2) {
    return (
      <p className="text-sm text-kc-ink-muted">Race a few more times to see your trend line.</p>
    );
  }

  const width = 600;
  const height = 160;
  const padding = 12;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        style={{ stroke: "var(--kc-accent)" }}
        strokeWidth="2"
      />
      {values.map((v, i) => {
        const [x, y] = points[i]!.split(",");
        return <circle key={i} cx={x} cy={y} r="2.5" style={{ fill: "var(--kc-accent)" }} />;
      })}
    </svg>
  );
}
