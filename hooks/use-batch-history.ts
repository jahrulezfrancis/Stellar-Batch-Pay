'use client';

import { useState, useEffect, useCallback } from 'react';
import { BatchResult } from '@/lib/stellar/types';

const STORAGE_KEY = 'stellar_batch_pay_history';

export function useBatchHistory() {
  const [history, setHistory] = useState<BatchResult[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse batch history', e);
      }
    }
  }, []);

  const saveResult = useCallback((result: BatchResult) => {
    setHistory((prev) => {
      const newHistory = [result, ...prev].slice(0, 50); // Keep last 50 batches
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }, []);

  const getLatestResult = useCallback(() => {
    return history[0] || null;
  }, [history]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
  }, []);

  return {
    history,
    saveResult,
    getLatestResult,
    clearHistory,
  };
}
