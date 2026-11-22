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
            ? Number((field.value * 100).toPrecision(15))
            : "";

        return (
          <div className="min-w-0">
            <label
              className="form-label"
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
                className="form-control form-control--percentage"
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
                className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-400 dark:text-slate-500"
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
