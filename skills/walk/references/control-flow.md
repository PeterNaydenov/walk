# Traversal controls

All helpers produce instructions that must be returned from the callback.
Calling a helper and then returning an ordinary value does not issue the
instruction. Ordinary objects and arrays are data, not instructions.

## IGNORE

`IGNORE()` is available to both callbacks:

- From `keyCallback`, remove this leaf and continue the walk.
- From `objectCallback`, remove this container and skip its whole branch.
- From the root object callback, stop without visiting children. Copying
  returns `{}` or `[]` matching the original root; no-copy returns `undefined`.

`IGNORE()` takes no arguments. Returning `undefined` is not removal.

## PASS

`PASS` is available only to `objectCallback`:

- `PASS()` keeps the current value.
- `PASS(replacement)` uses the supplied replacement.
- Both skip `keyCallback` only for this container's immediate leaves.
  Nested containers still run their object and key callbacks normally.
- Simple replacements are stored directly without a key callback.
- `PASS(undefined)` supplies an explicit replacement; it differs from
  `PASS()`, which keeps the current value.

This is local callback skipping, not pruning or retaining an entire branch
by reference. Object and array containers are still traversed and copied
when copying is enabled. In no-copy mode, `PASS` applies the same visit rules.

## FINISH without a value

Both callbacks receive `FINISH`. `return FINISH()` omits the current value
or branch and immediately stops the entire walk, including pending work.
It behaves like removal followed by stopping. Root `FINISH()` returns an
empty object or array matching the original root when copying.

## FINISH with a value

From `keyCallback`, `return FINISH(value)` includes the supplied value
directly and immediately stops. Supplied containers are not traversed or
copied; their references are retained.

From `objectCallback`, `return FINISH(value)` selects the final branch:

- Without `keyCallback`, include the supplied value directly and stop.
  Supplied object and array references are retained.
- With `keyCallback`, visit the final branch's leaves, including nested
  containers and containers returned by key callbacks. Each key callback
  receives `isFinished:true`. No further object callbacks run.
- In that final branch, return `value` to keep a leaf, `IGNORE()` to drop
  it and continue, or either `FINISH` form to stop immediately at that leaf.
- Ordinary key callbacks receive `isFinished:false`. Earlier `PASS`
  instructions do not suppress the selected branch's final key callbacks.
- A simple replacement from the root object callback remains a direct
  return, without a key callback, as in ordinary root replacement.

An explicit argument counts even if it is `undefined`:
`FINISH(undefined)` includes an undefined value; `FINISH()` omits it.
An object callback that wants to finish with its current value must return
`FINISH(value)`, not the zero-argument form.

## Results and search side effects

Copying returns the work completed before stopping. Unrelated containers
allocated earlier but still awaiting traversal can remain empty or partially
populated. Dropping all final leaves may leave empty nested containers.
Final-branch traversal uses the normal leaf return rules and cycle detection.

With `settings.copy:false`, every walk returns `undefined`, including a
walk that returns `FINISH(value)` from a callback. Store a search result in
external state before returning the instruction. Replacements are visited
without being assigned to the source.

Finishing is local to each walk; a nested walk has its own control state.
