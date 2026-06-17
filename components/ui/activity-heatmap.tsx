"use client";

import { format, startOfWeek, subWeeks, isAfter, parseISO } from "date-fns";

interface ActivityHeatmapProps {
  data: Record<string, number>; // "yyyy-MM-dd" -> numeric value
  title: string;
  weeks?: number;
  getLevel: (val: number) => 0 | 1 | 2 | 3 | 4;
  colors?: [string, string, string, string, string];
  tooltipLabel?: (val: number, date: string) => string;
  legend?: { label: string; level: 0 | 1 | 2 | 3 | 4 }[];
}

const VIOLET_COLORS: [string, string, string, string, string] = [
  "rgba(255,255,255,0.04)",
  "rgba(109,40,217,0.35)",
  "rgba(124,58,237,0.55)",
  "rgba(139,92,246,0.78)",
  "rgba(167,139,250,1.00)",
];

export const EMERALD_COLORS: [string, string, string, string, string] = [
  "rgba(255,255,255,0.04)",
  "rgba(6,78,59,0.6)",
  "rgba(4,120,87,0.7)",
  "rgba(16,185,129,0.75)",
  "rgba(52,211,153,0.95)",
];

export const RED_COLORS: [string, string, string, string, string] = [
  "rgba(255,255,255,0.04)",
  "rgba(239,68,68,0.25)",
  "rgba(239,68,68,0.50)",
  "rgba(239,68,68,0.75)",
  "rgba(239,68,68,1.00)",
];

const DAY_LABELS = ["M", "", "W", "", "F", "", "S"];

export function ActivityHeatmap({
  data,
  title,
  weeks = 16,
  getLevel,
  colors = VIOLET_COLORS,
  tooltipLabel,
  legend,
}: ActivityHeatmapProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start from Monday of (weeks-1) weeks ago
  const gridStart = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });

  // Build cell list (always full weeks)
  const cells: { date: string; val: number; inFuture: boolean; isToday: boolean }[] = [];
  const todayStr = format(today, "yyyy-MM-dd");
  const cursor = new Date(gridStart);

  // Go until end of this week
  const endOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 6);

  while (cursor <= endOfThisWeek) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    cells.push({
      date: dateStr,
      val: data[dateStr] || 0,
      inFuture: isAfter(cursor, today),
      isToday: dateStr === todayStr,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const numCols = Math.ceil(cells.length / 7);

  // Month labels: find the col where a new month starts
  const monthLabels: { col: number; label: string }[] = [];
  for (let col = 0; col < numCols; col++) {
    const cellIdx = col * 7;
    if (cellIdx >= cells.length) break;
    const d = parseISO(cells[cellIdx].date);
    if (d.getDate() <= 7) {
      monthLabels.push({ col, label: format(d, "MMM") });
    }
  }

  const CELL = 11;
  const GAP = 2;

  return (
    <div
      className="rounded-2xl"
      style={{ background: "rgb(22,22,26)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="px-6 pt-5 pb-3">
        <p
          className="text-[10.5px] font-semibold uppercase tracking-[0.1em]"
          style={{ color: "rgb(70,70,85)" }}
        >
          {title}
        </p>
      </div>
      <div className="px-6 pb-5 overflow-x-auto">
        <div style={{ display: "inline-flex", flexDirection: "column", gap: 0 }}>
          {/* Month labels row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${numCols}, ${CELL}px)`,
              gap: `${GAP}px`,
              marginLeft: `${CELL + GAP + 4}px`,
              marginBottom: "3px",
            }}
          >
            {Array.from({ length: numCols }, (_, col) => {
              const lbl = monthLabels.find((m) => m.col === col);
              return (
                <div
                  key={col}
                  style={{
                    fontSize: "9px",
                    color: "rgb(80,80,95)",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                  }}
                >
                  {lbl?.label ?? ""}
                </div>
              );
            })}
          </div>

          {/* Day labels + grid */}
          <div style={{ display: "flex", gap: `${GAP + 2}px` }}>
            {/* Day of week labels */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: `${GAP}px`,
                flexShrink: 0,
              }}
            >
              {DAY_LABELS.map((lbl, i) => (
                <div
                  key={i}
                  style={{
                    height: `${CELL}px`,
                    width: `${CELL}px`,
                    fontSize: "9px",
                    color: "rgb(70,70,85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  {lbl}
                </div>
              ))}
            </div>

            {/* Cells grid — column-major order */}
            <div
              style={{
                display: "grid",
                gridTemplateRows: `repeat(7, ${CELL}px)`,
                gridAutoFlow: "column",
                gridAutoColumns: `${CELL}px`,
                gap: `${GAP}px`,
              }}
            >
              {cells.map((cell) => {
                const level = cell.inFuture ? 0 : getLevel(cell.val);
                const bg = cell.inFuture
                  ? "rgba(255,255,255,0.01)"
                  : colors[level];
                const tip = cell.inFuture
                  ? ""
                  : tooltipLabel
                  ? tooltipLabel(cell.val, cell.date)
                  : `${cell.date}: ${cell.val}`;
                return (
                  <div
                    key={cell.date}
                    title={tip}
                    style={{
                      background: bg,
                      borderRadius: "2px",
                      cursor: "default",
                      outline: cell.isToday ? "1px solid rgba(139,92,246,0.6)" : undefined,
                      outlineOffset: "1px",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        {legend && (
          <div
            className="flex items-center gap-4 mt-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            <span style={{ fontSize: "10px", color: "rgb(70,70,85)" }}>Less</span>
            <div style={{ display: "flex", gap: "3px" }}>
              {([0, 1, 2, 3, 4] as const).map((l) => (
                <div
                  key={l}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    background: colors[l],
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "10px", color: "rgb(70,70,85)" }}>More</span>
            {legend.map((item) => (
              <div
                key={item.label}
                style={{ display: "flex", alignItems: "center", gap: 4 }}
              >
                <div
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    background: colors[item.level],
                  }}
                />
                <span style={{ fontSize: "10px", color: "rgb(90,90,105)" }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
