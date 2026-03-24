"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface ChartDataPoint {
  date: string;
  value: number;
}

const mockData: ChartDataPoint[] = [
  { date: "Jan 15", value: 12000 },
  { date: "Jan 16", value: 15000 },
  { date: "Jan 17", value: 18000 },
  { date: "Jan 18", value: 14000 },
  { date: "Jan 19", value: 19000 },
  { date: "Jan 20", value: 21000 },
  { date: "Jan 21", value: 16000 },
];

export function PaymentVolumeChart() {
  const [timeRange, setTimeRange] = useState("Last 7 days");

  const maxValue = Math.max(...mockData.map((d) => d.value));

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-white">Payment Volume</h2>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800"
          >
            {timeRange}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="relative h-64">
          {/* Y-axis grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[20000, 15000, 10000, 5000, 0].map((value) => (
              <div key={value} className="flex items-center">
                <span className="text-xs text-slate-500 w-20">
                  ${(value / 1000).toFixed(0)}k
                </span>
                <div className="flex-1 h-px bg-slate-800/50" />
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="absolute inset-0 pl-20 pt-2 pb-8 pr-4">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Area fill */}
              <defs>
                <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Create smooth curved path for area */}
              <path
                d={(() => {
                  const points = mockData.map((d, i) => ({
                    x: (i / (mockData.length - 1)) * 100,
                    y: 100 - (d.value / maxValue) * 100,
                  }));

                  let path = `M ${points[0].x},${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlX = (current.x + next.x) / 2;

                    path += ` Q ${controlX},${current.y} ${(current.x + next.x) / 2},${(current.y + next.y) / 2}`;
                    path += ` Q ${controlX},${next.y} ${next.x},${next.y}`;
                  }

                  path += ` L 100,100 L 0,100 Z`;
                  return path;
                })()}
                fill="url(#areaGradient)"
                vectorEffect="non-scaling-stroke"
              />

              {/* Smooth curved line */}
              <path
                d={(() => {
                  const points = mockData.map((d, i) => ({
                    x: (i / (mockData.length - 1)) * 100,
                    y: 100 - (d.value / maxValue) * 100,
                  }));

                  let path = `M ${points[0].x},${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlX = (current.x + next.x) / 2;

                    path += ` Q ${controlX},${current.y} ${(current.x + next.x) / 2},${(current.y + next.y) / 2}`;
                    path += ` Q ${controlX},${next.y} ${next.x},${next.y}`;
                  }

                  return path;
                })()}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data points */}
              {mockData.map((d, i) => (
                <circle
                  key={i}
                  cx={(i / (mockData.length - 1)) * 100}
                  cy={100 - (d.value / maxValue) * 100}
                  r="1.5"
                  fill="#10b981"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-20 right-4 flex justify-between text-xs text-slate-500">
            {mockData.map((d, i) => (
              <span key={i} className="text-center">
                {d.date}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
