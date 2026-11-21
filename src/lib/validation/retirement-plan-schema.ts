import { z } from "zod";

const ageSchema = z.number().int().min(0);
const moneySchema = z.number().finite().min(0);
const rateSchema = z.number().finite().min(-1);
const withdrawalSources = ["cash", "gia", "isa", "pension"] as const;

const personIncomeSchema = z.object({
  currentAge: ageSchema,
  statePensionAge: ageSchema,
  employment: z.object({
    currentSalary: moneySchema,
    annualSalaryGrowthRate: rateSchema,
    workUntilAge: ageSchema,
  }),
  secondEmployment: z.object({
    currentSalary: moneySchema,
    annualSalaryGrowthRate: rateSchema,
    startAge: ageSchema,
    endAge: ageSchema,
  }),
  otherIncome: z.object({
    rentalIncome: moneySchema,
    otherIncome: moneySchema,
  }),
  statePension: z.object({ annualAmount: moneySchema }),
});

const personSchema = z.object({
  income: personIncomeSchema,
  assets: z.object({
    isa: z.object({
      currentValue: moneySchema,
      monthlyContribution: moneySchema,
    }),
    pension: z.object({
      currentValue: moneySchema,
      monthlyContribution: moneySchema,
    }),
  }),
});

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
      retirementAge: ageSchema,
      lifeExpectancy: ageSchema,
      householdType: z.enum(["single", "joint"]),
    }),
    people: z.object({
      person1: personSchema,
      person2: personSchema,
    }),
    assets: z.object({
      gia: z.object({
        currentValue: moneySchema,
        costBasis: moneySchema,
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
    spending: z.object({ buckets: z.array(spendingBucketSchema) }),
    assumptions: z.object({
      isaRealReturn: rateSchema,
      pensionRealReturn: rateSchema,
      giaInterestRealYield: rateSchema,
      giaDividendRealYield: rateSchema,
      giaCapitalGrowthRealYield: rateSchema,
      cashInterestRealYield: rateSchema,
      inflationRate: rateSchema,
    }),
    taxSettings: z.object({
      jurisdiction: z.enum([
        "england",
        "scotland",
        "wales",
        "northern-ireland",
      ]),
    }),
    scenario: z.enum(["conservative", "expected", "optimistic"]),
    withdrawalOrder: z.array(z.enum(withdrawalSources)).length(4),
  })
  .superRefine((plan, context) => {
    const { retirementAge, lifeExpectancy } = plan.personalDetails;
    const people = [plan.people.person1, plan.people.person2];
    const person1Age = plan.people.person1.income.currentAge;

    if (person1Age >= retirementAge) {
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

    for (const [index, person] of people.entries()) {
      if (person.income.employment.workUntilAge < person.income.currentAge) {
        context.addIssue({
          code: "custom",
          path: ["people", index === 0 ? "person1" : "person2", "income", "employment", "workUntilAge"],
          message: "Work-until age must be at or after current age.",
        });
      }

      if (
        person.income.secondEmployment.startAge >
        person.income.secondEmployment.endAge
      ) {
        context.addIssue({
          code: "custom",
          path: [
            "people",
            index === 0 ? "person1" : "person2",
            "income",
            "secondEmployment",
            "endAge",
          ],
          message: "Second job end age must be at or after its start age.",
        });
      }
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
