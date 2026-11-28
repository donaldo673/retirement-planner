import { z } from "zod";

const ageSchema = z.number().int().min(0);
const moneySchema = z.number().finite().min(0);
const rateSchema = z.number().finite().min(-1);
const nonNegativeRateSchema = z.number().finite().min(0).max(1);
const accountTypes = ["cash", "gia", "isa", "pension"] as const;
const spendingClassifications = ["essential", "discretionary"] as const;
const defaultAccumulationPriority = ["pension", "isa", "gia", "cash"] as const;
const defaultWithdrawalPriority = ["cash", "gia", "isa", "pension"] as const;

const defaultMortgageConfiguration = {
  name: "Main residence",
  type: "residential" as const,
  currentFixedRate: 0.0425,
  fixedMonthsRemaining: 0,
  assumeRemortgage: true,
  futureRateMethod: "base-plus-margin" as const,
  baseRate: 0.0475,
  margin: 0.005,
  futureMortgageRate: 0.0575,
  annualMortgageOverpaymentTarget: 0,
  endOfTermTreatment: "rollover" as const,
  repaymentType: "repayment" as const,
  repaymentStrategy: "sale-of-property" as const,
  rentalIncome: 0,
  managementCosts: 0,
  maintenanceCosts: 0,
  voidPeriodAllowance: 0.05,
};
const defaultPropertyInformation = {
  estimatedValue: 300_000,
  type: "main-residence" as const,
  expectedGrowthRate: 0.025,
  futureSaleAge: 0,
  downsizeAge: 0,
  equityReleaseAge: 0,
  notes: "",
};

const mortgageConfigurationSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(["residential", "buy-to-let"]),
    currentFixedRate: nonNegativeRateSchema,
    fixedMonthsRemaining: z.number().int().min(0).max(1200),
    assumeRemortgage: z.boolean(),
    futureRateMethod: z.enum([
      "base-plus-margin",
      "keep-current-rate",
      "manual-rate",
    ]),
    baseRate: nonNegativeRateSchema,
    margin: nonNegativeRateSchema,
    futureMortgageRate: nonNegativeRateSchema,
    annualMortgageOverpaymentTarget: moneySchema,
    endOfTermTreatment: z.enum(["rollover", "repay-from-gia"]),
    repaymentType: z.enum(["repayment", "interest-only"]),
    repaymentStrategy: z.enum([
      "sale-of-property",
      "investments",
      "pension-lump-sum",
      "other",
    ]),
    rentalIncome: moneySchema,
    managementCosts: moneySchema,
    maintenanceCosts: moneySchema,
    voidPeriodAllowance: nonNegativeRateSchema,
  })
  .superRefine((configuration, context) => {
    if (
      configuration.assumeRemortgage &&
      configuration.futureRateMethod === "base-plus-margin" &&
      configuration.baseRate + configuration.margin > 1
    ) {
      context.addIssue({
        code: "custom",
        path: ["margin"],
        message: "Base rate plus margin cannot exceed 100%.",
      });
    }
  });

const propertyInformationSchema = z.object({
  estimatedValue: moneySchema,
  type: z.enum([
    "main-residence",
    "buy-to-let",
    "holiday-home",
    "second-property",
  ]),
  expectedGrowthRate: rateSchema.max(1),
  futureSaleAge: ageSchema.max(120),
  downsizeAge: ageSchema.max(120),
  equityReleaseAge: ageSchema.max(120),
  notes: z.string().max(2000),
});

const personIncomeSchema = z.object({
  currentAge: ageSchema,
  statePensionAge: ageSchema,
  employment: z.object({
    currentSalary: moneySchema,
    annualSalaryGrowthRate: rateSchema,
  }),
  secondEmployment: z.object({
    currentSalary: moneySchema,
    annualSalaryGrowthRate: rateSchema,
    startAge: ageSchema,
    startAtRetirementAge: z.boolean(),
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
  classification: z.enum(spendingClassifications),
  annualAmount: moneySchema,
  inflationRate: rateSchema,
  startAge: ageSchema,
  endAge: ageSchema,
});

const retirementPlanObjectSchema = z
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
    mortgageConfiguration: mortgageConfigurationSchema,
    propertyInformation: propertyInformationSchema,
    spending: z.object({
      buckets: z.array(spendingBucketSchema),
      discretionarySpendingAdjustmentPercent: z.number().finite().min(70).max(130),
    }),
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
      minimumCashReserve: moneySchema,
      optimiseTaxAutomatically: z.boolean(),
      accumulationPriority: z
        .array(z.enum(accountTypes))
        .length(accountTypes.length),
      withdrawalPriority: z
        .array(z.enum(accountTypes))
        .length(accountTypes.length),
    }),
    scenario: z.enum(["conservative", "expected", "optimistic"]),
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
          message:
            "Second / post retirement employment end age must be at or after its start age.",
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

    for (const priorityName of [
      "accumulationPriority",
      "withdrawalPriority",
    ] as const) {
      const priority = plan.taxSettings[priorityName];
      const sources = new Set(priority);
      if (sources.size !== accountTypes.length) {
        priority.forEach((source, index) => {
          if (priority.indexOf(source) !== index) {
            context.addIssue({
              code: "custom",
              path: ["taxSettings", priorityName, index],
              message: "Choose each account type once.",
            });
          }
        });
      }
    }
  });

export const retirementPlanSchema = retirementPlanObjectSchema;

function addStoredPlanDefaults(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const plan = value as Record<string, unknown>;
  const people =
    typeof plan.people === "object" &&
    plan.people !== null &&
    !Array.isArray(plan.people)
      ? (plan.people as Record<string, unknown>)
      : {};
  const spending =
    typeof plan.spending === "object" &&
    plan.spending !== null &&
    !Array.isArray(plan.spending)
      ? (plan.spending as Record<string, unknown>)
      : {};
  const mortgageConfiguration =
    typeof plan.mortgageConfiguration === "object" &&
    plan.mortgageConfiguration !== null &&
    !Array.isArray(plan.mortgageConfiguration)
      ? (plan.mortgageConfiguration as Record<string, unknown>)
      : {};
  const legacyMonthlyOverpayment = mortgageConfiguration.monthlyOverpayment;
  const legacyAnnualOverpayment =
    mortgageConfiguration.annualLumpSumOverpayment;
  const legacyOverpaymentTarget =
    (typeof legacyMonthlyOverpayment === "number" &&
    Number.isFinite(legacyMonthlyOverpayment)
      ? legacyMonthlyOverpayment * 12
      : 0) +
    (typeof legacyAnnualOverpayment === "number" &&
    Number.isFinite(legacyAnnualOverpayment)
      ? legacyAnnualOverpayment
      : 0);
  const legacyDiscretionaryReduction =
    spending.discretionaryReductionAfterRetirement;
  const migratedSpendingAdjustment =
    typeof legacyDiscretionaryReduction === "number" &&
    Number.isFinite(legacyDiscretionaryReduction)
      ? Math.max(70, Math.min(130, 100 - legacyDiscretionaryReduction))
      : 100;
  const personPlans = ["person1", "person2"].map((key) => {
    const person =
      typeof people[key] === "object" &&
      people[key] !== null &&
      !Array.isArray(people[key])
        ? (people[key] as Record<string, unknown>)
        : {};
    const income =
      typeof person.income === "object" &&
      person.income !== null &&
      !Array.isArray(person.income)
        ? (person.income as Record<string, unknown>)
        : {};
    const secondEmployment =
      typeof income.secondEmployment === "object" &&
      income.secondEmployment !== null &&
      !Array.isArray(income.secondEmployment)
        ? (income.secondEmployment as Record<string, unknown>)
        : {};
    const currentAge =
      typeof income.currentAge === "number" ? income.currentAge : 0;
    return {
      ...person,
      income: {
        ...income,
        secondEmployment: {
          ...secondEmployment,
          startAge: secondEmployment.startAge ?? currentAge,
          startAtRetirementAge: secondEmployment.startAtRetirementAge ?? true,
        },
      },
    };
  });
  const buckets = Array.isArray(spending.buckets)
    ? spending.buckets.map((value) => {
        if (
          typeof value !== "object" ||
          value === null ||
          Array.isArray(value)
        ) {
          return value;
        }
        const bucket = value as Record<string, unknown>;
        const name =
          typeof bucket.name === "string" ? bucket.name.toLowerCase() : "";
        const defaultClassification =
          ["travel", "lifestyle", "holiday", "discretionary"].some((word) =>
            name.includes(word),
          )
            ? "discretionary"
            : "essential";
        const currentAge =
          typeof plan.people === "object" &&
          plan.people !== null &&
          !Array.isArray(plan.people) &&
          typeof (plan.people as Record<string, unknown>).person1 === "object" &&
          (plan.people as Record<string, unknown>).person1 !== null
            ? ((plan.people as Record<string, unknown>).person1 as {
                income?: { currentAge?: unknown };
              }).income?.currentAge
            : undefined;
        return {
          ...bucket,
          classification: bucket.classification ?? defaultClassification,
          startAge:
            bucket.startAge ??
            (typeof currentAge === "number" ? currentAge : 0),
        };
      })
    : [];
  const taxSettings =
    typeof plan.taxSettings === "object" &&
    plan.taxSettings !== null &&
    !Array.isArray(plan.taxSettings)
      ? (plan.taxSettings as Record<string, unknown>)
      : {};
  return {
    ...plan,
    people: {
      ...people,
      person1: personPlans[0],
      person2: personPlans[1],
    },
    spending: {
      ...spending,
      buckets,
      discretionarySpendingAdjustmentPercent:
        spending.discretionarySpendingAdjustmentPercent ??
        migratedSpendingAdjustment,
    },
    mortgageConfiguration: {
      ...defaultMortgageConfiguration,
      ...mortgageConfiguration,
      annualMortgageOverpaymentTarget:
        mortgageConfiguration.annualMortgageOverpaymentTarget ??
        legacyOverpaymentTarget,
      endOfTermTreatment:
        mortgageConfiguration.endOfTermTreatment ?? "rollover",
    },
    propertyInformation:
      plan.propertyInformation ?? defaultPropertyInformation,
    taxSettings: {
      ...taxSettings,
      minimumCashReserve: taxSettings.minimumCashReserve ?? 10_000,
      optimiseTaxAutomatically:
        taxSettings.optimiseTaxAutomatically ?? true,
      accumulationPriority:
        taxSettings.accumulationPriority ?? defaultAccumulationPriority,
      withdrawalPriority:
        taxSettings.withdrawalPriority ??
        plan.withdrawalOrder ??
        defaultWithdrawalPriority,
    },
  };
}

export const storedRetirementPlanSchema = z.preprocess(
  addStoredPlanDefaults,
  retirementPlanSchema,
);

export const savedPlanSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().datetime(),
  plan: storedRetirementPlanSchema,
});
