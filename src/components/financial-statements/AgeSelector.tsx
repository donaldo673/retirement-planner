interface AgeSelectorProps {
  ages: number[];
  currentAge: number;
  selectedAge: number;
  onChange: (age: number) => void;
}

export function AgeSelector({
  ages,
  currentAge,
  selectedAge,
  onChange,
}: AgeSelectorProps) {
  return (
    <div className="min-w-0">
      <label
        className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300"
        htmlFor="financial-statement-age"
      >
        Selected Age
      </label>
      <select
        className="form-control min-w-36"
        id="financial-statement-age"
        onChange={(event) => onChange(Number(event.target.value))}
        value={selectedAge}
      >
        {ages.map((age) => (
          <option key={age} value={age}>
            {age === currentAge ? `Age ${age} — current snapshot` : `Age ${age}`}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
        Select any age from the current snapshot through the end of the
        projection.
      </p>
    </div>
  );
}
