'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/file-upload';
import { BatchSummary } from '@/components/batch-summary';
import { ResultsDisplay } from '@/components/results-display';
import { parseInput, validatePaymentInstructions } from '@/lib/stellar';
import type { PaymentInstruction, BatchResult } from '@/lib/stellar/types';
import { useBatchHistory } from '@/hooks/use-batch-history';

type PageState = 'upload' | 'preview' | 'executing' | 'results';

export default function Home() {
  const [state, setState] = useState<PageState>('upload');
  const [payments, setPayments] = useState<PaymentInstruction[]>([]);
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [result, setResult] = useState<BatchResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { saveResult } = useBatchHistory();

  const handleFileSelect = async (file: File, format: 'json' | 'csv') => {
    try {
      setError('');
      const content = await file.text();
      const parsed = parseInput(content, format);

      // Validate payments
      const validation = validatePaymentInstructions(parsed);
      if (!validation.valid) {
        const errors = Array.from(validation.errors.values()).slice(0, 3);
        throw new Error(`Invalid payments: ${errors.join(', ')}`);
      }

      setPayments(parsed);
      setState('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    }
  };

  const handleExecute = async () => {
    try {
      setError('');
      setIsLoading(true);
      setState('executing');

      const response = await fetch('/api/batch-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payments,
          network,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Batch submission failed');
      }

      const batchResult = await response.json();
      setResult(batchResult);
      saveResult(batchResult);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Batch submission failed');
      setState('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPayments([]);
    setResult(null);
    setError('');
    setState('upload');
  };

  const handleRetry = (failedPayments: PaymentInstruction[]) => {
    setPayments(failedPayments);
    setResult(null);
    setError('');
    setState('preview');
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Stellar BatchPay</h1>
          <p className="text-muted-foreground">
            Send multiple payments on the Stellar blockchain—fast, simple, and secure. Process bulk payments in seconds.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive rounded-lg p-4 mb-6">
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {state === 'upload' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Payment File</h2>
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {state === 'preview' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Preview</h2>
              <BatchSummary payments={payments} />
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold mb-4">Network Selection</h3>
              <div className="flex gap-4">
                {(['testnet', 'mainnet'] as const).map((net) => (
                  <label key={net} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="network"
                      value={net}
                      checked={network === net}
                      onChange={(e) => setNetwork(e.target.value as 'testnet' | 'mainnet')}
                      className="w-4 h-4"
                    />
                    <span className="capitalize text-foreground">{net}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Make sure your account has sufficient balance on the selected network.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleExecute}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Submitting...' : 'Submit Batch'}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
              >
                Change File
              </Button>
            </div>
          </div>
        )}

        {state === 'executing' && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="text-center">
                <div className="inline-block animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mb-4" />
                <p className="text-lg font-semibold">Submitting batch to Stellar...</p>
                <p className="text-sm text-muted-foreground mt-2">
                  This may take a moment. Do not close this window.
                </p>
              </div>
            </div>
          </div>
        )}

        {state === 'results' && result && (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Batch Results</h2>
              <ResultsDisplay result={result} onRetry={handleRetry} />
            </div>

            <Button
              onClick={handleReset}
              className="w-full"
            >
              Submit New Batch
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
