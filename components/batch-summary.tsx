'use client';

import { PaymentInstruction } from '@/lib/stellar/types';
import { formatAmount } from '@/lib/stellar';

interface BatchSummaryProps {
  payments: PaymentInstruction[];
}

export function BatchSummary({ payments }: BatchSummaryProps) {
  const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  // Group by asset
  const assetGroups = payments.reduce((acc, p) => {
    if (!acc[p.asset]) {
      acc[p.asset] = [];
    }
    acc[p.asset].push(p);
    return acc;
  }, {} as Record<string, PaymentInstruction[]>);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">Total Recipients</p>
          <p className="text-2xl font-bold">{payments.length}</p>
        </div>
        
        <div className="bg-card p-4 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">Total XLM Amount</p>
          <p className="text-2xl font-bold">{formatAmount(totalAmount)}</p>
        </div>
      </div>

      <div className="bg-card p-4 rounded-lg border border-border">
        <h3 className="font-semibold mb-3">Assets Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(assetGroups).map(([asset, items]) => {
            const amount = items.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            return (
              <div key={asset} className="flex justify-between text-sm">
                <span className="text-foreground">{asset}</span>
                <div>
                  <span className="font-mono mr-2">{formatAmount(amount)}</span>
                  <span className="text-muted-foreground">({items.length} payments)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
