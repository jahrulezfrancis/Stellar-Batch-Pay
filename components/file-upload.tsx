"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import Papa from 'papaparse';
import { validateCSVData, type CSVValidationError } from '@/lib/stellar/csv-validation-schema';

interface FileUploadProps {
  onFileSelect: (file: File, format: 'json' | 'csv') => void;
  disabled?: boolean;
}

interface ValidationState {
  errors: CSVValidationError[];
  validRowCount: number;
  totalRows: number;
}

export function FileUpload({ onFileSelect, disabled }: FileUploadProps) {
  const [fileName, setFileName] = useState('');
  const [validation, setValidation] = useState<ValidationState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCSV = async (file: File) => {
    try {
      const content = await file.text();
      const parsed = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
      });

      const result = validateCSVData(parsed.data, 2);
      setValidation({
        errors: result.errors,
        validRowCount: result.validRowCount,
        totalRows: result.totalRows,
      });

      if (!result.valid) {
        toast({
          title: "CSV validation errors",
          description: `Found ${result.errors.length} error(s) in ${result.totalRows} row(s)`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "CSV valid",
          description: `All ${result.totalRows} rows are valid`,
          variant: "default",
        });
      }

      return result.valid;
    } catch (error) {
      toast({
        title: "CSV parsing error",
        description: error instanceof Error ? error.message : "Failed to parse CSV",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['json', 'csv'].includes(ext || '')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON or CSV file",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setValidation(null);

    if (ext === 'csv') {
      validateCSV(file).then((isValid) => {
        if (isValid) {
          onFileSelect(file, ext);
        }
      });
    } else {
      onFileSelect(file, ext as 'json' | 'csv');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().split('.').pop();
    if (!['json', 'csv'].includes(ext || '')) {
      toast({
        title: "Invalid file type",
        description: "Please select a JSON or CSV file",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);
    setValidation(null);

    if (ext === 'csv') {
      validateCSV(file).then((isValid) => {
        if (isValid) {
          onFileSelect(file, ext);
        }
      });
    } else {
      onFileSelect(file, ext as 'json' | 'csv');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <a
          href="/examples/payments.csv"
          download="payments-sample.csv"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4 rounded-lg text-center font-medium transition-colors"
        >
          Download CSV Sample
        </a>
        <a
          href="/examples/payments.json"
          download="payments-sample.json"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-lg text-center font-medium transition-colors"
        >
          Download JSON Sample
        </a>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 hover:bg-slate-950/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-slate-300 mb-2">
          {fileName ? (
            <>
              <span className="font-semibold text-white">{fileName}</span>
              <br />
              <span className="text-sm text-slate-400">Click to change</span>
            </>
          ) : (
            <>
              <span>Drag and drop your file here</span>
              <br />
              <span className="text-sm text-slate-400">or click to browse</span>
            </>
          )}
        </p>
        <p className="text-xs text-slate-500 mt-2">Supported: JSON or CSV</p>
      </div>
      {validation && validation.errors.length > 0 && (
        <div className="mt-4 bg-red-900/30 border border-red-700/50 rounded-lg p-4">
          <h3 className="font-semibold text-red-400 mb-3">
            Validation Errors: {validation.errors.length} row(s) have issues
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {validation.errors.slice(0, 10).map((error, idx) => (
              <div key={idx} className="bg-red-950/50 p-2 rounded text-sm">
                <span className="font-mono text-red-300">Row {error.row}:</span>
                <span className="text-red-200 ml-2">
                  <strong>{error.field}</strong> - {error.message}
                </span>
              </div>
            ))}
            {validation.errors.length > 10 && (
              <div className="text-sm text-red-300">
                ... and {validation.errors.length - 10} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {validation && validation.errors.length === 0 && fileName.endsWith('.csv') && (
        <div className="mt-4 bg-green-900/30 border border-green-700/50 rounded-lg p-4">
          <p className="text-green-300 text-sm">
            ✓ All {validation.totalRows} rows are valid. Ready to submit!
          </p>
        </div>
      )}

      <div className="mt-4">
        <details className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm">
          <summary className="cursor-pointer font-semibold text-slate-300">
            File Format Requirements
          </summary>
          <div className="mt-3 space-y-2 text-slate-400">
            <div>
              <p className="font-mono text-xs bg-slate-950 p-2 rounded my-1 overflow-x-auto">
                JSON example: address, amount, asset
              </p>
            </div>
            <div>
              <p className="font-mono text-xs bg-slate-950 p-2 rounded my-1">
                CSV: address,amount,asset
              </p>
            </div>
            <ul className="list-disc list-inside text-xs ml-2">
              <li>address: Stellar public key (starts with G)</li>
              <li>amount: Positive number</li>
              <li>asset: 'XLM' or 'CODE:ISSUER'</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
