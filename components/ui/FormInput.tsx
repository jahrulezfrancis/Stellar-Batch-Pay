"use client";

import { InputHTMLAttributes, forwardRef, useState, ReactNode } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  optional?: boolean;
  rightElement?: ReactNode;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, optional, rightElement, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-300">
          {label}
          {optional && (
            <span className="ml-2 text-xs text-gray-500 font-normal">
              (Optional)
            </span>
          )}
        </label>
        <div className="relative">
          <input
            ref={ref}
            className={`
              w-full bg-[#1a2235] border rounded-lg px-4 py-3 text-white placeholder-gray-500
              text-sm outline-none transition-all duration-200
              hover:border-gray-500
              focus:border-[#00d4a0] focus:ring-1 focus:ring-[#00d4a0]/30
              ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : "border-gray-700"}
              ${rightElement ? "pr-12" : ""}
              ${className ?? ""}
            `}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
export default FormInput;