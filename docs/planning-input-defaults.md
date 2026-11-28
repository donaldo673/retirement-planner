# Planning input defaults

## Start ages

New plans start every user-entered start age at the relevant person's current
age. This applies to second / post retirement employment and each spending
category. Added spending categories use the primary planner's current age.
There are no separate start-age fields for rental income or other taxable
income in the current model.

The sample plan's Travel, Healthcare, and Lifestyle start ages were updated to
the primary planner's current age (45), matching the existing age defaults for
the other spending categories. The second person's post-retirement employment
start age remains set to that person's current age (43).

Saved plans with a missing employment start age or spending-category start age
are migrated to the relevant current age. Existing populated start ages are
preserved. Missing employment linkage settings default to starting at retirement
age. Legacy spending categories whose names indicate travel or lifestyle are
classified as discretionary; all other unclassified categories default to
essential to avoid reducing necessities.

## Discretionary spending

Post-retirement discretionary spending adjustment defaults to 100% and ranges
from 70% to 130% of the planned amount. It applies only to spending categories
classified as discretionary and only from the effective retirement age;
essential spending is unchanged. Previously saved reduction percentages are
migrated to the equivalent adjustment where possible and bounded to the new
70%–130% range.
