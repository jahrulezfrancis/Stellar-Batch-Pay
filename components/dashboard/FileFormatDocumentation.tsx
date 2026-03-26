"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertTriangle } from "lucide-react";

export function FileFormatDocumentation() {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          <CardTitle className="text-xl text-white">
            File Format Documentation
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CSV Format Section */}
        <div>
          <h3 className="text-white font-semibold mb-3">CSV Format</h3>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <pre className="text-slate-300 text-sm font-mono overflow-x-auto">
              <code>{`recipient_address,amount,memo
GDQP2KPGGKIHYJGXNUIYOMHARUARCA7DJTF5FO2FFOOKY3B2WSQHG4W37,100.50,Payment for services
GCKFBEIYTK P93XOXZ7DOEKDJ3DDKXZB4GGDJ2BPWQ4FHGPGBWKJFXRPF,250.00,Monthly salary
GDVXMSTPXZ7QFWDZ7QFWDZ7QFWDZ7QFWDZ7QFWDZ7QFWDZ7Q,75.25,Bonus payment`}</code>
            </pre>
          </div>
        </div>

        {/* JSON Format Section */}
        <div>
          <h3 className="text-white font-semibold mb-3">JSON Format</h3>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <pre className="text-slate-300 text-sm font-mono overflow-x-auto">
              <code>{`{
  "payments": [
    {
      "recipient_address": "GDQP2KPGGKIHYJGXNUIYOMHARUARCA7DJTF5FO2FFOOKY3B2WSQHG4W37",
      "amount": "100.50",
      "memo": "Payment for services"
    },
    {
      "recipient_address": "GCKFBEIYTK P93XOXZ7DOEKDJ3DDKXZB4GGDJ2BPWQ4FHGPGBWKJFXRPF",
      "amount": "250.00",
      "memo": "Monthly salary"
    }
  ]
}`}</code>
            </pre>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-yellow-500 font-semibold mb-1">Important</h4>
              <p className="text-slate-300 text-sm">
                All amounts must be in XLM and recipient addresses must be valid
                Stellar addresses.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
