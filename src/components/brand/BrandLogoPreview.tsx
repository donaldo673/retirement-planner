import Image from "next/image";

const logoVariants = [
  {
    title: "Light theme",
    background: "bg-white",
    horizontal: "/assets/brand/pendulum-horizontal-light.svg",
    mark: "/assets/brand/pendulum-mark-light.svg",
  },
  {
    title: "Dark theme",
    background: "bg-slate-950",
    horizontal: "/assets/brand/pendulum-horizontal-dark.svg",
    mark: "/assets/brand/pendulum-mark-dark.svg",
  },
] as const;

export function BrandLogoPreview() {
  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12 text-slate-950 dark:bg-slate-900 dark:text-white">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-semibold tracking-tight">
          Pendulum Retirement Plan brand
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          The pendulum-shaped P and timeline mark represent balance across life
          stages and long-term planning.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {logoVariants.map((variant) => (
            <section
              aria-label={`${variant.title} logo preview`}
              className={`rounded-2xl border border-slate-200 p-6 dark:border-slate-700 ${variant.background}`}
              key={variant.title}
            >
              <h2 className="mb-5 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {variant.title}
              </h2>
              <Image
                alt={`Pendulum Retirement Plan horizontal logo for ${variant.title.toLowerCase()}`}
                className="h-16 w-auto max-w-full"
                height={64}
                priority
                src={variant.horizontal}
                width={300}
              />
              <div className="mt-6 flex items-end gap-8">
                <div>
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Icon mark
                  </p>
                  <Image
                    alt={`Pendulum icon mark for ${variant.title.toLowerCase()}`}
                    height={64}
                    src={variant.mark}
                    width={64}
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                    Favicon
                  </p>
                  <Image
                    alt="Pendulum Retirement Plan favicon"
                    height={48}
                    src="/assets/brand/pendulum-favicon.svg"
                    width={48}
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
