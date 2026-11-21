# Tax and investment calculation model

The planner estimates an individual's annual UK income tax, employee Class 1
National Insurance, and Capital Gains Tax. It uses 2026/27 rules as its base;
projection years map one-for-one to tax years from 2026/27 onward.

## Included

- England, Wales, and Northern Ireland use the same non-savings income tax
  bands; Scotland uses its 2026/27 bands. Savings and dividend income use
  UK-wide rates.
- The standard Personal Allowance, its income taper, savings starting rate and
  Personal Savings Allowance, dividend allowance, and current savings/dividend
  tax rates are included.
- Employee National Insurance is estimated annually for each employment
  separately and stops at State Pension age.
- State Pension, taxable rental profit, other taxable income, and gross private
  pension withdrawals are included in taxable income. Pension withdrawals are
  treated as fully taxable; tax-free lump sums and UFPLS are not modeled.
- GIA interest and dividends are generated from real-yield assumptions and
  taxed as income. ISA and pension investment returns are tax-sheltered.
- GIA capital growth is untaxed until withdrawal. Realized gains use the
  supplied cost basis proportionally and the annual CGT exemption and rates.
- Thresholds remain fixed through 2027/28 and are indexed from 2028/29 using
  the plan's general inflation assumption. Rates are not inflation-adjusted.

Real yields are converted to nominal rates using
`(1 + inflation) × (1 + real yield) - 1`. A negative real yield can still
produce a positive nominal yield when inflation is higher. Negative nominal
interest or dividend amounts reduce available cash flow but are not treated as
deductible tax losses. Negative capital growth reduces the GIA value. A
realized loss is not taxed or carried forward.

## Important limitations

This is a planning estimate, not a tax return calculation or tax advice. It
does not model employer National Insurance, tax relief on pension
contributions, tax-free pension cash, marriage or other personal allowances,
property/trading allowances, foreign income, capital-loss carryforwards, or
share-identification rules for CGT (including same-day and 30-day matching).
Investment income is generated from annual real yields, rather than individual
holdings or transaction history. The planner models the selected person's
income; it does not split a joint household into two taxpayers.

Tax values are maintained in
[uk-tax.ts](../src/lib/calculations/uk-tax.ts). Review and update them against
current HMRC guidance when tax rules change:

- [Income Tax rates and Personal Allowances](https://www.gov.uk/income-tax-rates)
- [Scottish Income Tax](https://www.gov.uk/scottish-income-tax)
- [Employer rates and thresholds for 2026/27](https://www.gov.uk/guidance/rates-and-thresholds-for-employers-2026-to-2027)
- [Tax on dividends](https://www.gov.uk/tax-on-dividends)
- [Tax on savings interest](https://www.gov.uk/apply-tax-free-interest-on-savings/how-much-is-tax-free)
- [Capital Gains Tax rates](https://www.gov.uk/capital-gains-tax/rates) and
  [allowances](https://www.gov.uk/capital-gains-tax/allowances)
- [Autumn Budget 2024: personal tax thresholds](https://www.gov.uk/government/publications/autumn-budget-2024/autumn-budget-2024-html)
