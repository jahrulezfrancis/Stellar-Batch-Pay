'use client';

import { BatchResult, PaymentInstruction } from '@/lib/stellar/types';
import { Button } from '@/components/ui/button';

interface ResultsDisplayProps {
  result: BatchResult;
  onRetry?: (failedPayments: PaymentInstruction[]) => void;
}

export function ResultsDisplay({ result, onRetry }: ResultsDisplayProps) {
  const successCount = result.summary.successful;
  const failCount = result.summary.failed;
  const successRate = Math.round((successCount / result.totalRecipients) * 100);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">Successful</p>
          <p className="text-2xl font-bold text-green-600">{successCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{successRate}% success rate</p>
        </div>

        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">Failed</p>
          <p className="text-2xl font-bold text-destructive">{failCount}</p>
          <p className="text-xs text-muted-foreground mt-1">of {result.totalRecipients} total</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg border border-border">
        <h3 className="font-semibold mb-2">Batch Details</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network:</span>
            <span className="font-mono">{result.network}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Transactions:</span>
            <span className="font-mono">{result.totalTransactions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-mono">{result.totalAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Timestamp:</span>
            <span className="font-mono text-xs">{new Date(result.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Payment Details</h3>
        <div className="bg-card border border-border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary sticky top-0">
              <tr>
                <th className="text-left p-3 font-semibold">Recipient</th>
                <th className="text-right p-3 font-semibold">Amount</th>
                <th className="text-center p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((payment, idx) => (
                <tr key={idx} className="border-t border-border hover:bg-secondary/50">
                  <td className="p-3 font-mono text-xs">{payment.recipient.slice(0, 20)}...</td>
                  <td className="text-right p-3 font-mono">{payment.amount}</td>
                  <td className="text-center p-3">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        payment.status === 'success'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {failCount > 0 && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-semibold text-destructive">Partial Failure</p>
              <p className="text-xs text-muted-foreground">{failCount} payments failed to process.</p>
            </div>
            {onRetry && (
              <Button
                onClick={() => {
                  const failed = result.results
                    .filter(r => r.status === 'failed')
                    .map(r => ({
                      address: r.recipient,
                      amount: r.amount,
                      asset: r.asset
                    }));
                  onRetry(failed);
                }}
                variant="destructive"
                size="sm"
                className="shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                Retry Failed Only
              </Button>
            )}
          </div>
          <div className="space-y-1 text-muted-foreground max-h-32 overflow-y-auto">
            {result.results
              .filter(r => r.status === 'failed')
              .map((payment, idx) => (
                <div key={idx} className="text-xs flex justify-between">
                  <span className="font-mono">{payment.recipient.slice(0, 20)}...</span>
                  <span className="text-destructive/80 italic">{payment.error}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
