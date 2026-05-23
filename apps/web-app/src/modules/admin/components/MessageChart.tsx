"use client";

import { useState } from "react";
import type { MessageStatPoint } from "@/shared/types/admin";

interface MessageChartProps {
  data: MessageStatPoint[];
}

export default function MessageChart({ data }: MessageChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Chart sizing configuration
  const width = 600;
  const height = 280;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value to scale Y axis
  const maxVal = Math.max(
    ...data.flatMap((d) => [d.internal, d.external]),
    100 // default min peak
  );
  // Round up to nearest 50 or 100 for clean Y grid lines
  const yAxisMax = Math.ceil(maxVal / 50) * 50;

  // Map data index to X coordinate
  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  // Map value to Y coordinate (inverted since SVG 0,0 is top-left)
  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / yAxisMax) * chartHeight;
  };

  // Build SVG Path command for lines
  const generatePath = (key: "internal" | "external") => {
    return data.map((d, idx) => `${idx === 0 ? "M" : "L"}${getX(idx)},${getY(d[key])}`).join(" ");
  };

  // Build SVG Path command for filled areas under the lines
  const generateAreaPath = (key: "internal" | "external") => {
    const linePath = generatePath(key);
    const startX = getX(0);
    const endX = getX(data.length - 1);
    const bottomY = paddingTop + chartHeight;
    return `${linePath} L${endX},${bottomY} L${startX},${bottomY} Z`;
  };

  const internalPath = generatePath("internal");
  const externalPath = generatePath("external");
  const internalAreaPath = generateAreaPath("internal");
  const externalAreaPath = generateAreaPath("external");

  // Y-axis grid line values
  const yTicks = [0, yAxisMax * 0.25, yAxisMax * 0.5, yAxisMax * 0.75, yAxisMax];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Message Traffic</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Comparison between internal and external communication</p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3.5 text-[11px] font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span>Internal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>External</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas wrapper with responsive viewBox */}
      <div className="relative w-full flex-1 min-h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
        >
          {/* Definitions for gradients */}
          <defs>
            <linearGradient id="internalGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="externalGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y Axis Grid Lines & Labels */}
          {yTicks.map((tick, idx) => {
            const y = getY(tick);
            return (
              <g key={idx}>
                {idx > 0 && idx < yTicks.length - 1 && (
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
                  {tick}
                </text>
              </g>
            );
          })}

          {/* X Axis Baseline */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#e2e8f0"
            strokeWidth="1.2"
          />

          {/* Gradient Fills under paths */}
          <path d={internalAreaPath} fill="url(#internalGlow)" />
          <path d={externalAreaPath} fill="url(#externalGlow)" />

          {/* Line paths */}
          <path
            d={internalPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={externalPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Grid lines on hover */}
          {hoveredIdx !== null && (
            <line
              x1={getX(hoveredIdx)}
              y1={paddingTop}
              x2={getX(hoveredIdx)}
              y2={paddingTop + chartHeight}
              stroke="#cbd5e1"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points and Hover Triggers */}
          {data.map((d, idx) => {
            const cx = getX(idx);
            const cyInt = getY(d.internal);
            const cyExt = getY(d.external);
            const isHovered = hoveredIdx === idx;

            return (
              <g key={idx}>
                {/* Invisible hover capture block */}
                <rect
                  x={cx - 15}
                  y={paddingTop}
                  width={30}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Internal Circle indicator */}
                <circle
                  cx={cx}
                  cy={cyInt}
                  r={isHovered ? 5.5 : 3.5}
                  fill="white"
                  stroke="#3b82f6"
                  strokeWidth={isHovered ? 2.5 : 1.8}
                  className="transition-all duration-150 pointer-events-none"
                />

                {/* External Circle indicator */}
                <circle
                  cx={cx}
                  cy={cyExt}
                  r={isHovered ? 5.5 : 3.5}
                  fill="white"
                  stroke="#10b981"
                  strokeWidth={isHovered ? 2.5 : 1.8}
                  className="transition-all duration-150 pointer-events-none"
                />
              </g>
            );
          })}

          {/* X Axis Labels */}
          {data.map((d, idx) => {
            const showLabel = data.length < 8 || idx % 2 === 0 || idx === data.length - 1;
            if (!showLabel) return null;

            return (
              <text
                key={idx}
                x={getX(idx)}
                y={height - paddingBottom + 18}
                fill="#94a3b8"
                fontSize="9.5"
                fontWeight="bold"
                textAnchor="middle"
              >
                {d.date}
              </text>
            );
          })}
        </svg>

        {/* Dynamic Tooltip overlay */}
        {hoveredIdx !== null && (
          <div
            className="absolute rounded-lg border border-slate-200 bg-white p-2.5 shadow-md pointer-events-none text-left z-10 transition-all duration-150 animate-in fade-in"
            style={{
              left: `${(getX(hoveredIdx) / width) * 100}%`,
              top: `10%`,
              transform: "translateX(-50%)",
            }}
          >
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {data[hoveredIdx].date}
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-4 justify-between">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  Internal:
                </span>
                <span className="text-[11px] font-bold text-slate-700">{data[hoveredIdx].internal}</span>
              </div>
              <div className="flex items-center gap-4 justify-between">
                <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  External:
                </span>
                <span className="text-[11px] font-bold text-slate-700">{data[hoveredIdx].external}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
