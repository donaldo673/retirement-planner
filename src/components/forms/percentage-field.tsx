"use client";

import { Controller, useFormContext, type FieldPathByValue } from "react-hook-form";
import type { RetirementPlan } from "@/types/retirement";

type NumericFieldName = FieldPathByValue<RetirementPlan, number>;

interface PercentageFieldProps {
  name: NumericFieldName;
  label: string;
  min?: number;
  description?: string;
}

export function PercentageField({
  name,
  label,
  min = -100,
  description,
}: PercentageFieldProps) {
  const { control } = useFormContext<RetirementPlan>();
  const id = name.replace(/\./g, "-");
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const errorId = fieldState.error ? `${id}-error` : undefined;
        const displayValue =
          typeof field.value === "number" && Number.isFinite(field.value)
            ? field.value * 100
            : "";

        return (
          <div className="min-w-0">
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor={id}
            >
              {label}
            </label>
            <div className="relative">
              <input
                aria-describedby={
                  [descriptionId, errorId].filter(Boolean).join(" ") || undefined
                }
                aria-invalid={Boolean(fieldState.error)}
                className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 ${
                  fieldState.error
                    ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10"
                    : ""
                }`}
                id={id}
                inputMode="decimal"
                min={min}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  field.onChange(
                    rawValue === "" ? Number.NaN : Number(rawValue) / 100,
                  );
                }}
                ref={field.ref}
                step="0.1"
                type="number"
                value={displayValue}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400"
              >
                %
              </span>
            </div>
            {description ? (
              <p
                className="mt-1.5 text-xs leading-5 text-slate-500"
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
            {fieldState.error?.message ? (
              <p
                className="mt-1.5 text-xs font-medium text-rose-600"
                id={errorId}
                role="alert"
              >
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
