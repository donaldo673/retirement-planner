"use client";

import { useState } from "react";
import type {
  Scenario,
  ScenarioTemplateId,
} from "@/types/scenarios";
import { ScenarioList } from "@/components/scenarios/ScenarioList";
import { scenarioTemplates } from "@/lib/scenarios/scenarioTemplates";

interface ScenarioManagerProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  isLoading: boolean;
  currentPlanChanged: boolean;
  storageError: string | null;
  onSaveCurrent: () => Promise<Scenario>;
  onCreateTemplate: (template: ScenarioTemplateId) => Promise<Scenario>;
  onDuplicate: (id: string) => Promise<Scenario>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoad: (id: string, saveCurrentFirst: boolean) => Promise<void>;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "The scenario action failed.";
}

export function ScenarioManager({
  scenarios,
  activeScenarioId,
  isLoading,
  currentPlanChanged,
  storageError,
  onSaveCurrent,
  onCreateTemplate,
  onDuplicate,
  onRename,
  onDelete,
  onLoad,
}: ScenarioManagerProps) {
  const [isWorking, setIsWorking] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(
    null,
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);

  async function runAction<T>(
    action: () => Promise<T>,
    successMessage: string,
  ): Promise<{ succeeded: boolean; value: T | null }> {
    setIsWorking(true);
    setNotice(null);
    try {
      const value = await action();
      setNotice({ kind: "success", message: successMessage });
      return { succeeded: true, value };
    } catch (error) {
      setNotice({ kind: "error", message: getErrorMessage(error) });
      return { succeeded: false, value: null };
    } finally {
      setIsWorking(false);
    }
  }

  async function saveCurrent() {
    const outcome = await runAction(
      onSaveCurrent,
      "Current plan saved as a scenario.",
    );
    if (outcome.value) {
      setEditingScenarioId(outcome.value.id);
    }
  }

  async function createTemplate(template: ScenarioTemplateId) {
    const outcome = await runAction(
      () => onCreateTemplate(template),
      "Scenario created from the selected template.",
    );
    if (outcome.value) {
      setEditingScenarioId(outcome.value.id);
    }
  }

  async function duplicate(id: string) {
    const outcome = await runAction(
      () => onDuplicate(id),
      "Scenario duplicated.",
    );
    if (outcome.value) {
      setEditingScenarioId(outcome.value.id);
    }
  }

  async function rename(id: string, name: string) {
    const outcome = await runAction(
      () => onRename(id, name),
      "Scenario renamed.",
    );
    if (outcome.succeeded) {
      setEditingScenarioId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDeleteId) {
      return;
    }
    const outcome = await runAction(
      () => onDelete(pendingDeleteId),
      "Scenario deleted.",
    );
    if (outcome.succeeded) {
      setPendingDeleteId(null);
    }
  }

  async function confirmLoad(saveCurrentFirst: boolean) {
    if (!pendingLoadId) {
      return;
    }
    const outcome = await runAction(
      () => onLoad(pendingLoadId, saveCurrentFirst),
      saveCurrentFirst
        ? "Current plan saved and selected scenario loaded."
        : "Scenario loaded into the planner.",
    );
    if (outcome.succeeded) {
      setPendingLoadId(null);
    }
  }

  const pendingDelete = scenarios.find(
    (scenario) => scenario.id === pendingDeleteId,
  );
  const pendingLoad = scenarios.find(
    (scenario) => scenario.id === pendingLoadId,
  );

  return (
    <section
      aria-labelledby="scenario-manager-heading"
      className="mt-10 scroll-mt-24"
      id="scenario-manager"
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
            Compare your options
          </p>
          <h2
            className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
            id="scenario-manager-heading"
          >
            Scenario planning
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Save independent copies of your plan, then compare how different
            choices affect the projection.
          </p>
        </div>
        <button
          className="min-h-11 shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:opacity-50 dark:bg-teal-400 dark:text-slate-950 dark:hover:bg-teal-300"
          disabled={isLoading || isWorking}
          onClick={saveCurrent}
          type="button"
        >
          Save current plan as scenario
        </button>
      </div>

      {(storageError || notice) && (
        <p
          className={`mb-4 rounded-xl border px-3 py-2.5 text-sm ${
            storageError || notice?.kind === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
          }`}
          role={storageError || notice?.kind === "error" ? "alert" : "status"}
        >
          {storageError ?? notice?.message}
        </p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Quick scenario generator
            </h3>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Each template starts from a separate copy of the current plan.
            </p>
          </div>
          {isLoading && (
            <span className="text-xs font-medium text-slate-500" role="status">
              Loading saved scenarios…
            </span>
          )}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {scenarioTemplates.map((template) => (
            <button
              className="min-h-10 rounded-xl border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-950/40"
              disabled={isLoading || isWorking}
              key={template.id}
              onClick={() => createTemplate(template.id)}
              type="button"
            >
              + {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Saved scenarios
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Stored in this browser only.
          </p>
        </div>
        {isLoading ? (
          <div
            aria-label="Loading saved scenarios"
            className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
            role="status"
          />
        ) : (
          <ScenarioList
            activeScenarioId={activeScenarioId}
            editingScenarioId={editingScenarioId}
            isBusy={isWorking}
            onDelete={setPendingDeleteId}
            onDuplicate={duplicate}
            onLoad={setPendingLoadId}
            onRename={rename}
            scenarios={scenarios}
          />
        )}
      </div>

      {pendingDelete && (
        <div
          aria-labelledby="delete-scenario-heading"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3
              className="text-base font-semibold text-slate-950 dark:text-white"
              id="delete-scenario-heading"
            >
              Delete “{pendingDelete.name}”?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              This saved scenario will be removed from this browser. Your
              current plan and other scenarios will not be changed.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                disabled={isWorking}
                onClick={() => setPendingDeleteId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white disabled:opacity-50"
                disabled={isWorking}
                onClick={confirmDelete}
                type="button"
              >
                Delete scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingLoad && (
        <div
          aria-labelledby="load-scenario-heading"
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
          role="dialog"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900">
            <h3
              className="text-base font-semibold text-slate-950 dark:text-white"
              id="load-scenario-heading"
            >
              Load “{pendingLoad.name}” into the planner?
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {currentPlanChanged
                ? "Your current plan has changed since it was loaded. Save a scenario snapshot first to keep those edits, or replace the current plan."
                : "This replaces the current editable plan saved in this browser. Save a scenario snapshot first if you want to keep it separately."}
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                className="min-h-10 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                disabled={isWorking}
                onClick={() => setPendingLoadId(null)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="min-h-10 rounded-xl border border-amber-300 px-4 text-sm font-semibold text-amber-900 dark:border-amber-800 dark:text-amber-200"
                disabled={isWorking}
                onClick={() => confirmLoad(false)}
                type="button"
              >
                Replace current plan
              </button>
              <button
                className="min-h-10 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-teal-400 dark:text-slate-950"
                disabled={isWorking}
                onClick={() => confirmLoad(true)}
                type="button"
              >
                Save current &amp; load
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
