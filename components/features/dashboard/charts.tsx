import { cn } from "@/lib/utils/cn";

// Lightweight, dependency-free SVG charts for the commune dashboard.
// Rendered server-side (static SVG) to avoid shipping a charting bundle.
// Colors come exclusively from design-system tokens passed as CSS vars.

export type SeriesPoint = { label: string; value: number };

export type Series = {
  key: string;
  label: string;
  /** CSS variable token name, e.g. "--purple". */
  colorVar: string;
  values: number[];
};

function niceTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const step = Math.ceil(max / 2);
  return [0, step, step * 2];
}

function ChartLegend({
  items,
}: {
  items: { label: string; colorVar: string }[];
}) {
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map((it) => (
        <li
          key={it.label}
          className="flex items-center gap-1.5 text-xs font-medium text-muted"
        >
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: `var(${it.colorVar})` }}
          />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

/** Single-series area + line chart used for the cumulative residents trend. */
export function AreaTrendChart({
  points,
  colorVar = "--purple",
  className,
}: {
  points: SeriesPoint[];
  colorVar?: string;
  className?: string;
}) {
  const W = 720;
  const H = 240;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = points.length;

  const maxValue = Math.max(1, ...points.map((p) => p.value));
  const ticks = niceTicks(maxValue);
  const top = ticks[ticks.length - 1];

  const x = (i: number) =>
    padL + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const y = (v: number) => padT + innerH - (innerH * v) / top;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`)
    .join(" ");
  const areaPath =
    n > 0
      ? `${linePath} L${x(n - 1)},${padT + innerH} L${x(0)},${padT + innerH} Z`
      : "";

  const labelStep = Math.ceil(n / 12);

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-subtle"
              style={{ fontSize: 10 }}
            >
              {t}
            </text>
          </g>
        ))}

        {areaPath ? (
          <path
            d={areaPath}
            style={{ fill: `var(${colorVar})`, fillOpacity: 0.14 }}
          />
        ) : null}
        {n > 1 ? (
          <path
            d={linePath}
            fill="none"
            style={{ stroke: `var(${colorVar})` }}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}

        {points.map((p, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <g key={`${p.label}-${i}`}>
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={3}
                style={{ fill: `var(${colorVar})` }}
              />
              <text
                x={x(i)}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted"
                style={{ fontSize: 10 }}
              >
                {p.label}
              </text>
            </g>
          ) : null,
        )}
      </svg>
    </div>
  );
}

/** Grouped vertical bar chart for several content series per month. */
export function GroupedBarChart({
  categories,
  series,
  className,
}: {
  categories: string[];
  series: Series[];
  className?: string;
}) {
  const W = 720;
  const H = 260;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const n = categories.length;

  const maxValue = Math.max(
    1,
    ...series.flatMap((s) => s.values),
  );
  const ticks = niceTicks(maxValue);
  const top = ticks[ticks.length - 1];

  const groupWidth = n > 0 ? innerW / n : innerW;
  const barGap = 2;
  const groupPad = groupWidth * 0.18;
  const barAreaWidth = groupWidth - groupPad * 2;
  const barWidth =
    series.length > 0
      ? Math.max(2, (barAreaWidth - barGap * (series.length - 1)) / series.length)
      : barAreaWidth;

  const y = (v: number) => padT + innerH - (innerH * v) / top;
  const labelStep = Math.ceil(n / 12);

  return (
    <div className={cn("w-full space-y-3", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        preserveAspectRatio="xMidYMid meet"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={padL - 6}
              y={y(t) + 3}
              textAnchor="end"
              className="fill-subtle"
              style={{ fontSize: 10 }}
            >
              {t}
            </text>
          </g>
        ))}

        {categories.map((cat, gi) => {
          const groupX = padL + groupWidth * gi + groupPad;
          return (
            <g key={`${cat}-${gi}`}>
              {series.map((s, si) => {
                const v = s.values[gi] ?? 0;
                const bx = groupX + si * (barWidth + barGap);
                const by = y(v);
                const bh = padT + innerH - by;
                return (
                  <rect
                    key={s.key}
                    x={bx}
                    y={by}
                    width={barWidth}
                    height={Math.max(0, bh)}
                    rx={2}
                    style={{ fill: `var(${s.colorVar})` }}
                  >
                    <title>{`${cat} · ${s.label}: ${v}`}</title>
                  </rect>
                );
              })}
              {gi % labelStep === 0 || gi === n - 1 ? (
                <text
                  x={groupX + barAreaWidth / 2}
                  y={H - 10}
                  textAnchor="middle"
                  className="fill-muted"
                  style={{ fontSize: 10 }}
                >
                  {cat}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <ChartLegend
        items={series.map((s) => ({ label: s.label, colorVar: s.colorVar }))}
      />
    </div>
  );
}
