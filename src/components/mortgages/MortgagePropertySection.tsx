"use client";

import { useFormContext } from "react-hook-form";
import { NumberField } from "@/components/forms/number-field";
import { PercentageField } from "@/components/forms/percentage-field";
import { ProgressiveDisclosure } from "@/components/mortgages/ProgressiveDisclosure";
import type { RetirementPlan } from "@/types/retirement";

export function MortgagePropertySection() {
  const {
    register,
    formState: { errors },
  } = useFormContext<RetirementPlan>();

  return (
    <section
      aria-labelledby="property-information-heading"
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
      id="property-information"
    >
      <div>
        <h3
          className="text-sm font-semibold text-slate-900 dark:text-slate-100"
          id="property-information-heading"
        >
          Property Information
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
          Property value and future property plans are recorded separately from
          the existing retirement projection.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          error={errors.propertyInformation?.estimatedValue?.message}
          label="Estimated Property Value"
          name="propertyInformation.estimatedValue"
          prefix="£"
        />
        <div className="min-w-0">
          <label className="form-label" htmlFor="property-type">
            Property Type
          </label>
          <select
            className="form-control"
            id="property-type"
            {...register("propertyInformation.type")}
          >
            <option value="main-residence">Main Residence</option>
            <option value="buy-to-let">Buy to Let</option>
            <option value="holiday-home">Holiday Home</option>
            <option value="second-property">Second Property</option>
          </select>
        </div>
      </div>

      <ProgressiveDisclosure title="Property Advanced Options">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PercentageField
              label="Expected Growth Rate"
              max={100}
              min={-100}
              name="propertyInformation.expectedGrowthRate"
            />
            <NumberField
              description="Use 0 if you have no planned sale age."
              label="Future Sale Age"
              max={120}
              min={0}
              name="propertyInformation.futureSaleAge"
              step={1}
              suffix="age"
            />
            <NumberField
              description="Use 0 if you have no planned downsize age."
              label="Downsize Age"
              max={120}
              min={0}
              name="propertyInformation.downsizeAge"
              step={1}
              suffix="age"
            />
            <NumberField
              description="Use 0 if you have no planned equity release age."
              label="Equity Release Age"
              max={120}
              min={0}
              name="propertyInformation.equityReleaseAge"
              step={1}
              suffix="age"
            />
          </div>
          <div>
            <label className="form-label" htmlFor="property-notes">
              Notes
            </label>
            <textarea
              aria-describedby="property-notes-description"
              className="form-control min-h-24 resize-y"
              id="property-notes"
              maxLength={2000}
              {...register("propertyInformation.notes")}
            />
            <p
              className="mt-1.5 text-xs leading-5 text-slate-500 dark:text-slate-400"
              id="property-notes-description"
            >
              Private notes saved with this plan on this device. These details
              are not used in the projection.
            </p>
            {errors.propertyInformation?.notes?.message && (
              <p className="mt-1.5 text-xs font-medium text-rose-600" role="alert">
                {errors.propertyInformation.notes.message}
              </p>
            )}
          </div>
        </div>
      </ProgressiveDisclosure>
    </section>
  );
}
