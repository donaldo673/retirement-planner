interface FIProgressProps {
  currentAge: number;
  financialIndependenceAge: number | null;
  retirementAge: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function FIProgress({
  currentAge,
  financialIndependenceAge,
  retirementAge,
}: FIProgressProps) {
  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const reached = financialIndependenceAge !== null &&
    financialIndependenceAge <= currentAge;
  const timelinePosition =
    financialIndependenceAge === null
      ? 0
      : reached
        ? 100
        : yearsToRetirement === 0
          ? 100
          : clamp(
              ((financialIndependenceAge - currentAge) / yearsToRetirement) *
                100,
              0,
              100,
            );
  const milestoneLabel =
    financialIndependenceAge === null
      ? "Not reached"
      : `Age ${financialIndependenceAge}`;
  const description =
    financialIndependenceAge === null
      ? "Financial independence was not reached within this projection."
      : reached
        ? `Your projection indicates the financial independence milestone has already been reached by age ${currentAge}.`
        : financialIndependenceAge > retirementAge
          ? `Financial independence is projected after your target retirement age, at age ${financialIndependenceAge}.`
          : `Financial independence is projected in ${financialIndependenceAge - currentAge} years, at age ${financialIndependenceAge}.`;
  const timelineDescription =
    financialIndependenceAge === null
      ? "No financial independence age was reached in this projection."
      : financialIndependenceAge > retirementAge
        ? `Financial independence is projected after target retirement age ${retirementAge}, at age ${financialIndependenceAge}; the indicator is shown at the end of the timeline.`
      : `The milestone is at ${Math.round(timelinePosition)} percent of the age timeline from current age ${currentAge} to target retirement age ${retirementAge}.`;

  return (
    <section
      aria-labelledby="fi-progress-heading"
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">
            Your timeline
          </p>
          <h2
            className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white"
            id="fi-progress-heading"
          >
            Financial independence
          </h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {description}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center sm:gap-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs dark:text-slate-400">
            Current age
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">
            {currentAge}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-teal-700 sm:text-xs dark:text-teal-300">
            FI age
          </p>
          <p className="mt-1 text-sm font-semibold text-teal-800 sm:text-base dark:text-teal-200">
            {milestoneLabel}
          </p>
        </div>
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs dark:text-slate-400">
            Target retirement
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base dark:text-slate-100">
            {retirementAge}
          </p>
        </div>
      </div>

      <div
        aria-label="Projected financial independence milestone on the age timeline"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(timelinePosition)}
        aria-valuetext={timelineDescription}
        className="relative mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800"
        role="progressbar"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-1000 ease-out motion-reduce:transition-none"
          style={{ width: `${timelinePosition}%` }}
        />
        {financialIndependenceAge !== null ? (
          <span
            aria-hidden="true"
            className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-emerald-600 shadow ring-1 ring-emerald-200 dark:border-slate-900 dark:ring-emerald-800"
            style={{ left: `${timelinePosition}%` }}
          />
        ) : null}
      </div>
      <div className="mt-2 flex justify-between text-[0.65rem] leading-5 text-slate-500 sm:text-xs dark:text-slate-400">
        <span>Current age {currentAge}</span>
        <span>Target age {retirementAge}</span>
      </div>
      <p className="sr-only">{timelineDescription}</p>
    </section>
  );
}
