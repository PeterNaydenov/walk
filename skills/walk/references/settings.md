# Paths, settings, and cycles

## Defaults and speed tuning

All settings are enabled unless explicitly set to literal `false`:

| Setting | With `false` |
| --- | --- |
| `copy` | Skip result-container allocation and insertion; return `undefined` |
| `breadcrumbs` | Skip breadcrumb preparation; omit the callback field |
| `parentPath` | Skip parent-array preparation; omit the callback field |
| `detectCycles` | Skip ancestor bookkeeping and circular-reference checks |

Settings are independent. `copy:false` alone does not disable path
preparation. Without callbacks, neither path is prepared automatically.
Omitted settings and values other than literal `false` remain enabled.

Explain optimisation in terms of unnecessary work avoided. Do not disable
paths the callback uses. Disable cycle detection only when visited input
and callback replacements are acyclic, or callbacks prune cyclic branches
before revisiting them. Otherwise traversal may continue indefinitely.

## Paths

`breadcrumbs` is a slash-delimited string including the current key, such
as `'root/profile/age'`. The root object callback receives `'root'`.

`parentPath` is a frozen, shared array excluding the current key:

| Location | `key` | `parentPath` |
| --- | --- | --- |
| Root object callback | `'root'` | `[]` |
| Immediate root property | Property name | `['root']` |
| `data.profile.age` | `'age'` | `['root','profile']` |
| `data.items[0].score` | `'score'` | `['root','items','0']` |

Create a full path with `[ ...parentPath, key ]`, or a breadcrumb string
with `[ ...parentPath, key ].join ( '/' )`. Never mutate `parentPath`.
Do not reconstruct property boundaries by splitting breadcrumbs: keys may
contain `/`. Paths use input array indexes, even when output is compacted.

Disabled fields are absent. Destructuring one gives `undefined`; check its
setting before using it. TypeScript declares both path fields as optional.

## Cycles and shared containers

With detection enabled, a reference back to an ancestor points to that
ancestor's copy, without revisiting its contents. For `data.self === data`,
the copied result satisfies `result.self === result`. In no-copy mode,
traversal stops at the circular edge.

Object callbacks still see circular properties and may remove or replace
them. Ancestor checks happen after callback replacement and also apply to
containers returned by key callbacks. Detection works with both paths off.

Shared containers encountered on separate non-ancestor branches are copied
independently. For `{ a:shared, b:shared }`, `result.a !== result.b`.
Walk therefore preserves circular ancestor links, not general shared graph
identity. Choose a graph clone when preserved shared identity is required.
