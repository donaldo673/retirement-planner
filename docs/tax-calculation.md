# Tax and investment calculation model

The planner estimates annual UK income tax, employee Class 1 National
Insurance, and Capital Gains Tax separately for each person. It uses 2026/27
rules as its base; projection years map one-for-one to tax years from 2026/27
onward.

## Included

- England, Wales, and Northern Ireland use the same non-savings income tax
  bands; Scotland uses its 2026/27 bands. Savings and dividend income use
  UK-wide rates.
- The standard Personal Allowance, its income taper, savings starting rate and
  Personal Savings Allowance, dividend allowance, and current savings/dividend
  tax rates are included.
- Employee National Insurance is estimated annually for each employment
  separately for each person and stops at that person's State Pension age.
- Joint households are modeled as two independent taxpayers with separate
  personal allowances, income-tax bands, and National Insurance calculations.
  Each person has their own ISA and pension balances and contributions.
- State Pension, taxable rental profit, other taxable income, and gross private
  pension withdrawals are included in taxable income. Pension withdrawals are
  treated as fully taxable; tax-free lump sums and UFPLS are not modeled.
- Gross pension contributions reduce adjusted net income and income tax.
  Contribution funding uses the resulting tax reduction to estimate the net
  cash cost. The projection limits contributions to £60,000 per person and
  relevant earned income; it does not model carry-forward or the tapered
  annual allowance.
- GIA interest and dividends are generated from real-yield assumptions and
  taxed as income. ISA and pension investment returns are tax-sheltered.
- GIA capital growth is untaxed until withdrawal. Realized gains use the
  supplied cost basis proportionally and the annual CGT exemption and rates.
  GIA/cash interest, dividends, and realized gains are attributed to Person 1.
- Surplus first tops up the cash reserve, then funds the target ISA contribution
  from available surplus cash and, when affordable after Capital Gains Tax,
  GIA assets. Actual contributions are capped by the target and the £20,000
  annual ISA allowance. The target is reported separately from the achieved
  contribution.
- Cash is the first source used to cover a spending deficit and may be drawn
  down to zero; any remaining shortfall is handled by the configured withdrawal
  order. Automatic optimisation compares account orders after cash is fixed
  first.
- The annual mortgage overpayment target is paid only from surplus remaining
  after spending, standard mortgage payments, reserve funding, and the target
  ISA contribution. Mortgage maturity either carries the remaining balance
  forward at the assumed future rate or repays as much as available GIA assets
  allow, rolling over any remainder. GIA-funded repayments reduce GIA assets
  and may realize taxable gains.
- Thresholds remain fixed through 2027/28 and are indexed from 2028/29 using
  the plan's general inflation assumption. Rates are not inflation-adjusted.

Real yields are converted to nominal rates using
`(1 + inflation) × (1 + real yield) - 1`. A negative real yield can still
produce a positive nominal yield when inflation is higher. Negative nominal
interest or dividend amounts reduce available cash flow but are not treated as
deductible tax losses. Negative capital growth reduces the GIA value. A
realized loss is not taxed or carried forward.

## Important limitations

This is a planning estimate, not a tax return calculation or tax advice. The
automatic account choices are annual, greedy estimates rather than a global
optimisation across every future tax year. The model assumes gross personal
pension contributions qualify for relief within its limits; it does not model
employer National Insurance, pension carry-forward, the tapered annual
allowance, tax-free pension cash, marriage or other personal allowances,
property/trading allowances, foreign income, capital-loss carryforwards, or
share-identification rules for CGT (including same-day and 30-day matching).
Investment income is generated from annual real yields, rather than individual
holdings or transaction history. ISA and pension withdrawals are allocated
proportionally across each person's balances; pension withdrawals are taxed
separately for each person. A single household ignores the Person 2 projection.

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
