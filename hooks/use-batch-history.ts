'use client';

import { useState, useEffect, useCallback } from 'react';
import { BatchResult } from '@/lib/stellar/types';
import { getBatchHistory, setCachedHistory, clearCachedHistory } from '@/lib/batch-history-adapter';

/**
 * #341: Unified batch history hook
 * 
 * Uses the server-side SQLite job store as the source of truth,
 * with localStorage as an offline cache with TTL.
 */
export function useBatchHistory(publicKey?: string | null) {
  const [history, setHistory] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from server (with cache fallback)
  const loadHistory = useCallback(async (forceRefresh = false) => {
    if (!publicKey) {
      setHistory([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const items = await getBatchHistory(publicKey, { forceRefresh });
      setHistory(items);
    } catch (e) {
      console.error('Failed to load batch history', e);
      setError(e instanceof Error ? e.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Load on mount and when publicKey changes
  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const saveResult = useCallback((result: BatchResult) => {
    setHistory((prev) => {
      const newHistory = [result, ...prev].slice(0, 50);
      // Update cache
      setCachedHistory(newHistory);
      return newHistory;
    });
  }, []);

  const getLatestResult = useCallback(() => {
    return history[0] || null;
  }, [history]);

  const clearHistory = useCallback(() => {
    clearCachedHistory();
    setHistory([]);
  }, []);

  const refresh = useCallback(() => {
    return loadHistory(true);
  }, [loadHistory]);

  return {
    history,
    loading,
    error,
    saveResult,
    getLatestResult,
    clearHistory,
    refresh,
  };
}
