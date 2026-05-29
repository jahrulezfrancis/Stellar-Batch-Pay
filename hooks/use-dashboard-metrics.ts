"use client";

import { useState, useEffect } from "react";

export interface DashboardMetricsTimeSeriesPoint {
  date: string;
  amount: number;
}

export interface DashboardMetrics {
  totalPayments: number;
  totalAmountSent: string;
  successRate: string;
  activeBatches: number;
  timeSeries?: DashboardMetricsTimeSeriesPoint[];
  range?: "7d" | "30d" | "90d";
}

export function useDashboardMetrics(
  publicKey: string | null,
  network: "testnet" | "mainnet",
  range?: "7d" | "30d" | "90d",
) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setMetrics(null);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          publicKey,
          network,
        });
        if (range) params.set("range", range);
        const response = await fetch(`/api/dashboard-metrics?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch metrics: ${response.statusText}`);
        }

        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        // Set default metrics when there's an error
        setMetrics({
          totalPayments: 0,
          totalAmountSent: "0 XLM",
          successRate: "0.0%",
          activeBatches: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [publicKey, network, range]);

  return { metrics, loading, error };
}
