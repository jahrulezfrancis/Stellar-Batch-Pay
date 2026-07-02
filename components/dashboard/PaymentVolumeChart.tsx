"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Sample data — only rendered in `previewMode` (marketing / unconnected
// screenshots). #518: never shown to a connected wallet, which must always see
// API-driven volume or an honest empty state.
const data7Days = [
  { date: "Jan 15", amount: 12500 },
  { date: "Jan 16", amount: 15800 },
  { date: "Jan 17", amount: 18200 },
  { date: "Jan 18", amount: 14500 },
  { date: "Jan 19", amount: 16800 },
  { date: "Jan 20", amount: 20500 },
  { date: "Jan 21", amount: 17200 },
];

const data30Days = [
  { date: "Dec 22", amount: 11000 },
  { date: "Dec 25", amount: 13500 },
  { date: "Dec 28", amount: 15200 },
  { date: "Dec 31", amount: 12800 },
  { date: "Jan 3", amount: 14500 },
  { date: "Jan 6", amount: 16200 },
  { date: "Jan 9", amount: 18500 },
  { date: "Jan 12", amount: 15800 },
  { date: "Jan 15", amount: 17200 },
  { date: "Jan 18", amount: 19500 },
  { date: "Jan 21", amount: 17200 },
];

const data90Days = [
  { date: "Oct", amount: 9500 },
  { date: "Nov", amount: 12200 },
  { date: "Dec", amount: 14800 },
  { date: "Jan", amount: 17200 },
];

type TimeRange = "7d" | "30d" | "90d";

export interface PaymentVolumePoint {
  date: string;
  amount: number;
}

export interface PaymentVolumeChartProps {
  /**
   * Optional callback fired when the user changes the range. The analytics
   * page uses this to re-fetch the time-series from `/api/dashboard-metrics`.
   */
  onRangeChange?: (range: TimeRange) => void;
  /**
   * Initial time range to render. Defaults to `"7d"`.
   */
  initialRange?: TimeRange;
  /**
   * Live data points for the chart. When provided the chart uses these
   * instead of the built-in sample arrays — leave undefined for the
   * unconnected-wallet preview.
   */
  data?: {
    "7d"?: PaymentVolumePoint[];
    "30d"?: PaymentVolumePoint[];
    "90d"?: PaymentVolumePoint[];
  };
  /**
   * #518: opt-in to the built-in sample arrays for marketing screenshots or
   * the unconnected-wallet preview. Defaults to `false` so a connected
   * wallet with no history sees an honest empty state instead of fictional
   * volume that looks like real financial data.
   */
  previewMode?: boolean;
}

/**
 * Choose the series the chart renders for a given range. (#518)
 *
 * Priority: live data for the range → sample arrays only when `previewMode`
 * is set → otherwise an empty series so the chart shows an honest empty state
 * rather than mock volume. Kept as a pure, exported function so the
 * connected-wallet guarantee (mock never leaks) is unit-testable without a DOM.
 */
export function selectVolumeSeries(
  timeRange: TimeRange,
  data: PaymentVolumeChartProps["data"],
  previewMode: boolean,
): PaymentVolumePoint[] {
  const live = data?.[timeRange];
  if (live && live.length > 0) return live;

  if (!previewMode) return [];

  switch (timeRange) {
    case "30d":
      return data30Days;
    case "90d":
      return data90Days;
    case "7d":
    default:
      return data7Days;
  }
}

export function PaymentVolumeChart({
  onRangeChange,
  initialRange = "7d",
  data,
  previewMode = false,
}: PaymentVolumeChartProps = {}) {
  const [timeRange, setTimeRange] = useState<TimeRange>(initialRange);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const chartData = selectVolumeSeries(timeRange, data, previewMode);
  const isEmpty = chartData.length === 0;
  // The fallback sample arrays are showing — flag it so the data is never
  // mistaken for real volume.
  const showingSample = previewMode && !(data?.[timeRange]?.length);

  const getLabel = () => {
    switch (timeRange) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      default:
        return "Last 7 days";
    }
  };

  return (
    <Card className="h-full border-[#1F2937] bg-[#121827]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">Payment Volume</h2>
            {showingSample && (
              <span className="rounded bg-[#1F2937] px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
                Sample data
              </span>
            )}
          </div>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              className="border-[#1F2937] bg-[#1F2937]/30 text-gray-300 hover:bg-[#1F2937]/50 text-xs"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {getLabel()} <ChevronDown className="ml-2 h-3 w-3" />
            </Button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded-md border border-[#1F2937] bg-[#121827] shadow-lg z-10">
                <div className="py-1">
                  {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
                    <button
                      key={range}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#1F2937]/50"
                      onClick={() => {
                        setTimeRange(range);
                        onRangeChange?.(range);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {range === "7d" && "Last 7 days"}
                      {range === "30d" && "Last 30 days"}
                      {range === "90d" && "Last 90 days"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="h-48">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
              <p className="text-sm font-medium text-gray-300">No payment volume yet</p>
              <p className="text-xs text-gray-500">
                Send a batch payment to start tracking your volume here.
              </p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D98B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D98B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1F2937"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#6B7280"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1F2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [
                  `$${value.toLocaleString()}`,
                  "Amount",
                ]}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#00D98B"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAmount)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
