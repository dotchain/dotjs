# Modeling relationships in the real world

Consider an agricultural statistics page/app/document.

It might start out with a table of fruit production:

| Fruit | State | Economy Size |
| ----- | ----- | ------------ |
| Apple | WA    | 4.6billion Lb  |

And might have a separate table for vegetables:

| Vegetable | Region |
| --------- | ------ |
| Wheat     | Eastern WA |


The tables wont necessarily have the same schema though it would make sense to logically group them (maybe under a Produce hierarchy).

Now consider adding a table of pest infestation:

| Pest | Affects | Pesticide |
| ---- | ------- | ------- |
| Codling Moth | Apple |  |
| Aphids | Wheat | |

There may be a separate table of diseases:

| Disease | Affects | Identification |
| ------- | ------- | -------------- |
| Leaf Rust | Wheat | orange to brown coloration |

The two tables are obviously related but do not exactly have the same schema either.

## Hierarchy

The main relationship is one of hierarchy: Pest and Disease both **belong to** a `Pest and Diseases` section.  Allowing such groupings enables the ability to talk about **(Pest or Disease)** and **Affects** as if they were in a single table.

A more normalized representation would be to have a single **Pest and Diseases** table with pointers to the specific information for each category.  But this is not only unnatural, it is not required for expressive or declarative power but mainly for implementation purposes.

The cost of the grouping is extra storage but if the grouping resulted in the virtual **Pest and Diseases** table, it would make it easier for users to migrate to that by inverting the relationship:  **Pest and Diseases** is the master with the indivudal sub-tables becoming views.

Towards this end, in the intermediate stage where `Pest and Diseases` is a view:
* Editing the underlying tables should get accurately reflected in the view (Reactive, Forward flow)
* Editing the view should proxy changes to the underlying tables (Reactive in the reverse direction, Feedback flow)

The feedback flow is quite tricky here since adding a row to the view does not have sufficient information on whether the added row is a **Pest** or **Disease**.  A simple option is to annotate the **(Pest or Disease)** column to specify if it is pest  or disease (maybe with a visual dropdown/tag) and so the editing experience can require specifying the appropriate option.

## Linking relationship

The secondary relationship here is that the `Affects` column links to either the `Fruit` table or the `Vegetable` table (and more specifically to the Fruit or Vegetable column).  It is not natural for users to create a  `Affects` relationship table (with two columns: `Pest or Disease` and `Fruit or Vegetable`).

But it is reasonable for users to **annotate** this relationship, which can then silently create the underlying table and modify the columns as needed.  Alternatively, the system can simply build a secondary index, leaving all the tables as the user built (but providing  the ability for the user to shift to making the indices the primary source with the local columns simply being views on the relationshiop table)

Either way, declaratively specifying a simple linked relationship can lead to better UX consequences:

1. The edit experience for this column can show a select list of the correct state or region.   This can also be declaratively specified (maybe with a sort order based on frequency or recency).
2. Adding an unknown name can automatically lead the user to fill up the corresponding state/region entry.
3. Reverse navigation: Navigating from the state to the pests affecting that state can be automatically implemented in the UX with ability to edit the relationship from that direction.
4. Constraints on relationships can be implemented better than constraints on calculations on columns.  A many-1 relationship, for example, can make sure that a) autocomplete only lists unassigned options b) choosing an option that has been assigned can simply change the assignment.

## Other relationships

The "link" relationship is loose and has no constraints at all. The hierarchy is a form of 1-many relationship (with other examples being org charts, task assignments etc).  Sometimes relationships require extra attributes on the **edge** rather than on the **vertex**: user has access to a table with a particular **role**.  Technically these are 3-way relationships (user, table, role) but most people do not think of these like that  but instead think of them as a two-way relationship (user, table) with an extra column (role) that is itself a relationship between (user,table) and (roles).

## Entity relationship modeling

Much of this is similar to entity relationship modeling.  The main difference though is to capture semantics and focus on that rather than implementation.  For example, it should not matter whether the `Pests` table has an `Affects` column or whether there is a separate `Pest-Affects-State` table with `Pest` and `State` columns.  The effect to the user should be virtually the same.  The implementation can choose  to modify the underlying  tables to achieve this or simply build the `Pest-Affects-State` as a secondary index and achieve the same effects.

The same is true for the heterogenous relationship of `Pest and Diseases` (as a union of `Pest` and `Diseases` tables).

## Bidirectional transformations

Much of this requires getting the primitive set of bi-directional transformations right: filter/group-by/map etc specify behavior in one direction.  There are multiple `filter` implementations possible when the reverse direction is considered together.

The ideal lower level implementation is a pair of (forward flow, feedback flow) that can be combined to get a single transformation.  It might even be possible to take `result = x + y` and decompose it into `forward : result = x + y; feedback: x = result/2, y = result/2` and take the individual implementations for each.

That said, it is probably ok if we only have hardcoded primitives where the forward/reverse flow are defined together with no ability to decompose them.
