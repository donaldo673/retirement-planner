"use client";

import { Controller, useFormContext, type FieldPathByValue } from "react-hook-form";
import type { RetirementPlan } from "@/types/retirement";

type NumericFieldName = FieldPathByValue<RetirementPlan, number>;

interface NumberFieldProps {
  name: NumericFieldName;
  label: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number | "any";
}

export function NumberField({
  name,
  label,
  error,
  prefix,
  suffix,
  description,
  min,
  max,
  step = "any",
}: NumberFieldProps) {
  const { control } = useFormContext<RetirementPlan>();
  const id = name.replace(/\./g, "-");
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const fieldError = fieldState.error?.message ?? error;
        const errorId = fieldError ? `${id}-error` : undefined;
        const displayValue =
          typeof field.value === "number" && Number.isFinite(field.value)
            ? field.value
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
              {prefix ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-400"
                >
                  {prefix}
                </span>
              ) : null}
              <input
                aria-describedby={
                  [descriptionId, errorId].filter(Boolean).join(" ") || undefined
                }
                aria-invalid={Boolean(fieldError)}
                className={`min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10 ${
                  prefix ? "pl-8" : ""
                } ${suffix ? "pr-14" : ""} ${
                  fieldError
                    ? "border-rose-500 focus:border-rose-600 focus:ring-rose-500/10"
                    : ""
                }`}
                id={id}
                inputMode="decimal"
                max={max}
                min={min}
                name={field.name}
                onBlur={field.onBlur}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  field.onChange(rawValue === "" ? Number.NaN : Number(rawValue));
                }}
                ref={field.ref}
                step={step}
                type="number"
                value={displayValue}
              />
              {suffix ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400"
                >
                  {suffix}
                </span>
              ) : null}
            </div>
            {description ? (
              <p
                className="mt-1.5 text-xs leading-5 text-slate-500"
                id={descriptionId}
              >
                {description}
              </p>
            ) : null}
            {fieldError ? (
              <p
                className="mt-1.5 text-xs font-medium text-rose-600"
                id={errorId}
                role="alert"
              >
                {fieldError}
              </p>
            ) : null}
          </div>
        );
      }}
    />
  );
}
