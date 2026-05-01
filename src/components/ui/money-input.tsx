"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | undefined;
  onValueChange: (value: number | undefined) => void;
  prefix?: string;
}

function formatWithSeparators(raw: string): string {
  if (!raw) return "";
  const cleaned = raw.replace(/[^\d]/g, "");
  if (!cleaned) return "";
  return Number(cleaned).toLocaleString("en-US");
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ className, value, onValueChange, prefix = "$", ...props }, ref) => {
    const [display, setDisplay] = React.useState<string>(
      value != null ? Number(value).toLocaleString("en-US") : ""
    );

    React.useEffect(() => {
      const numericDisplay = Number(display.replace(/[^\d]/g, ""));
      if (value == null && display !== "") {
        setDisplay("");
      } else if (value != null && numericDisplay !== value) {
        setDisplay(Number(value).toLocaleString("en-US"));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = formatWithSeparators(e.target.value);
      setDisplay(next);
      const numeric = next.replace(/,/g, "");
      onValueChange(numeric === "" ? undefined : Number(numeric));
    };

    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={display}
          onChange={handleChange}
          className={cn(
            "flex h-11 w-full rounded-lg border border-gray-200 bg-white py-2 text-sm text-gray-900 placeholder:text-gray-400 tabular-nums",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400",
            "disabled:cursor-not-allowed disabled:opacity-50",
            prefix ? "pl-8 pr-4" : "px-4",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
MoneyInput.displayName = "MoneyInput";
