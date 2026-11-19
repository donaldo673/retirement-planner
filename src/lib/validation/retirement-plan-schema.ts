import { z } from "zod";

const ageSchema = z.number().int().min(0);
const moneySchema = z.number().finite().min(0);
const rateSchema = z.number().finite().min(-1);
const withdrawalSources = ["cash", "gia", "isa", "pension"] as const;

const spendingBucketSchema = z.object({
  id: z.string().trim().min(1, "Each bucket needs an ID."),
  name: z.string().trim().min(1, "Enter a spending category name."),
  annualAmount: moneySchema,
  inflationRate: rateSchema,
  startAge: ageSchema,
  endAge: ageSchema,
});

export const retirementPlanSchema = z
  .object({
    personalDetails: z.object({
      currentAge: ageSchema,
      retirementAge: ageSchema,
      lifeExpectancy: ageSchema,
      statePensionAge: ageSchema,
      householdType: z.enum(["single", "joint"]),
    }),
    assets: z.object({
      isa: z.object({
        currentValue: moneySchema,
        monthlyContribution: moneySchema,
      }),
      pension: z.object({
        currentValue: moneySchema,
        monthlyContribution: moneySchema,
      }),
      gia: z.object({
        currentValue: moneySchema,
        monthlyContribution: moneySchema,
      }),
      cash: z.object({ currentValue: moneySchema }),
      otherAssets: z.object({ currentValue: moneySchema }),
      mortgage: z.object({
        outstandingBalance: moneySchema,
        interestRate: moneySchema,
        monthlyPayment: moneySchema,
        mortgageEndAge: ageSchema,
      }),
    }),
    income: z.object({
      employment: z.object({
        currentSalary: moneySchema,
        annualSalaryGrowthRate: rateSchema,
        workUntilAge: ageSchema,
      }),
      otherIncome: z.object({
        rentalIncome: moneySchema,
        otherIncome: moneySchema,
      }),
      statePension: z.object({ annualAmount: moneySchema }),
    }),
    spending: z.object({ buckets: z.array(spendingBucketSchema) }),
    assumptions: z.object({
      isaReturn: rateSchema,
      pensionReturn: rateSchema,
      giaReturn: rateSchema,
      cashReturn: rateSchema,
      inflationRate: rateSchema,
    }),
    scenario: z.enum(["conservative", "expected", "optimistic"]),
    withdrawalOrder: z.array(z.enum(withdrawalSources)).length(4),
  })
  .superRefine((plan, context) => {
    const { currentAge, retirementAge, lifeExpectancy } = plan.personalDetails;

    if (currentAge >= retirementAge) {
      context.addIssue({
        code: "custom",
        path: ["personalDetails", "retirementAge"],
        message: "Retirement age must be greater than current age.",
      });
    }

    if (retirementAge >= lifeExpectancy) {
      context.addIssue({
        code: "custom",
        path: ["personalDetails", "lifeExpectancy"],
        message: "Life expectancy must be greater than retirement age.",
      });
    }

    if (
      plan.income.employment.workUntilAge < currentAge ||
      plan.income.employment.workUntilAge > lifeExpectancy
    ) {
      context.addIssue({
        code: "custom",
        path: ["income", "employment", "workUntilAge"],
        message: "Choose an age between your current age and life expectancy.",
      });
    }

    const ids = new Set<string>();
    for (const [index, bucket] of plan.spending.buckets.entries()) {
      if (ids.has(bucket.id)) {
        context.addIssue({
          code: "custom",
          path: ["spending", "buckets", index, "name"],
          message: "Each spending category must have a unique ID.",
        });
      }
      ids.add(bucket.id);

      if (bucket.startAge > bucket.endAge) {
        context.addIssue({
          code: "custom",
          path: ["spending", "buckets", index, "endAge"],
          message: "End age must be at or after start age.",
        });
      }
    }

    const sources = new Set(plan.withdrawalOrder);
    if (sources.size !== withdrawalSources.length) {
      plan.withdrawalOrder.forEach((source, index) => {
        if (plan.withdrawalOrder.indexOf(source) !== index) {
          context.addIssue({
            code: "custom",
            path: ["withdrawalOrder", index],
            message: "Choose each withdrawal source once.",
          });
        }
      });
    }
  });
