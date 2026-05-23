"use client";

import type { UserGrowthPoint } from "@/shared/types/admin";

interface UserGrowthChartProps {
  data: UserGrowthPoint[];
}

export default function UserGrowthChart({ data }: UserGrowthChartProps) {
  const width = 320;
  const height = 280;
  const paddingLeft = 40;
  const paddingRight = 10;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(...data.map((d) => d.count), 1000);
  const yAxisMax = Math.ceil(maxVal / 500) * 500;

  const getBarHeight = (value: number) => {
    return (value / yAxisMax) * chartHeight;
  };

  const getBarX = (idx: number) => {
    const sectionWidth = chartWidth / data.length;
    return paddingLeft + idx * sectionWidth + (sectionWidth - 32) / 2;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - getBarHeight(value);
  };

  const yTicks = [0, yAxisMax * 0.5, yAxisMax];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-full">
      <div className="pb-4 border-b border-slate-100 mb-4">
        <h3 className="text-sm font-bold text-slate-800">User Growth</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Accumulated user count over the last months</p>
      </div>

      <div className="relative w-full flex-1 min-h-[220px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full select-none">
          {/* Grid lines */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                {idx > 0 && (
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1.2"
                  />
                )}
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="end"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(1)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Base line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />

          {/* Bars */}
          {data.map((d, idx) => {
            const barHeight = getBarHeight(d.count);
            const x = getBarX(idx);
            const y = getY(d.count);

            return (
              <g key={idx} className="group">
                {/* Visual bar */}
                <rect
                  x={x}
                  y={y}
                  width={32}
                  height={barHeight}
                  rx="4"
                  fill="#005fb8"
                  className="transition-opacity duration-200 hover:opacity-85"
                />

                {/* Text count overlay above bar */}
                <text
                  x={x + 16}
                  y={y - 6}
                  fill="#475569"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {d.count}
                </text>

                {/* Month label */}
                <text
                  x={x + 16}
                  y={height - paddingBottom + 18}
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
