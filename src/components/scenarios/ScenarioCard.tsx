"use client";

import { memo, useState, type FormEvent } from "react";
import type { Scenario } from "@/types/scenarios";

interface ScenarioCardProps {
  scenario: Scenario;
  isActive: boolean;
  autoEdit: boolean;
  isBusy: boolean;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onLoad: (id: string) => void;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  notation: "compact",
  maximumFractionDigits: 1,
});

function ScenarioCardComponent({
  scenario,
  isActive,
  autoEdit,
  isBusy,
  onDuplicate,
  onRename,
  onDelete,
  onLoad,
}: ScenarioCardProps) {
  const [isEditing, setIsEditing] = useState(autoEdit);
  const [name, setName] = useState(scenario.name);
  const summary = scenario.results.projection.summary;

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onRename(scenario.id, name);
    setIsEditing(false);
  }

  return (
    <article
      className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm dark:bg-slate-900 ${
        isActive
          ? "border-teal-400 ring-2 ring-teal-100 dark:border-teal-700 dark:ring-teal-950"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <form className="flex gap-2" onSubmit={submitRename}>
              <label className="sr-only" htmlFor={`scenario-name-${scenario.id}`}>
                Scenario name
              </label>
              <input
                autoFocus
                className="form-control min-h-9"
                disabled={isBusy}
                id={`scenario-name-${scenario.id}`}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                value={name}
              />
              <button
                className="min-h-9 rounded-lg bg-teal-700 px-3 text-xs font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-slate-950"
                disabled={isBusy}
                type="submit"
              >
                Save
              </button>
            </form>
          ) : (
            <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-white">
              {scenario.name}
            </h3>
          )}
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Saved {new Date(scenario.createdAt).toLocaleDateString("en-GB")}
          </p>
        </div>
        {isActive && (
          <span className="shrink-0 rounded-full bg-teal-50 px-2 py-1 text-[11px] font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            Current
          </span>
        )}
      </div>

      {scenario.description && (
        <p className="mt-3 break-words text-xs leading-5 text-slate-600 dark:text-slate-400">
          {scenario.description}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div>
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
            Retirement age
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {scenario.inputs.plan.personalDetails.retirementAge}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
            FI age
          </dt>
          <dd className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {summary.financialIndependenceAge ?? "Not reached"}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">
            Final estate
          </dt>
          <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {currencyFormatter.format(summary.finalEstateValue)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <button
          className="min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
          disabled={isBusy}
          onClick={() => onLoad(scenario.id)}
          type="button"
        >
          Load scenario
        </button>
        <button
          aria-label={`Duplicate ${scenario.name}`}
          className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          disabled={isBusy}
          onClick={() => onDuplicate(scenario.id)}
          type="button"
        >
          Duplicate
        </button>
        <button
          aria-label={`Rename ${scenario.name}`}
          className="min-h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          disabled={isBusy}
          onClick={() => setIsEditing(true)}
          type="button"
        >
          Rename
        </button>
        <button
          aria-label={`Delete ${scenario.name}`}
          className="min-h-9 rounded-lg border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/50"
          disabled={isBusy}
          onClick={() => onDelete(scenario.id)}
          type="button"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export const ScenarioCard = memo(ScenarioCardComponent);
