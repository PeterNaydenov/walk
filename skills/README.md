# Walk skill

The distributable skill is [walk/SKILL.md](walk/SKILL.md). Its name is
`walk`, matching the library. Install the entire `walk` folder, including
`references`; installing only `SKILL.md` loses the detailed guidance.

## Agent integration

Keep the canonical skill in `skills/walk/`, independent of any agent vendor.
Agents can read it at that path or install the same folder using their skill
installer. Discovery locations differ between agents; top-level `skills/`
does not imply automatic discovery by every tool. For example, Claude Code
documents separate project, personal, and plugin locations in its
[skill documentation](https://code.claude.com/docs/en/skills).

Do not duplicate the skill under `.claude` or change personal agent
configuration as part of maintaining this directory.

## Authoring sources

Guidance checked on October 4, 2026:

- [Anthropic skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices): concise instructions, precise descriptions, progressive disclosure, direct references, and evaluation-driven iteration.
- [Claude Code skills](https://code.claude.com/docs/en/skills): discovery locations, invocation, frontmatter, and supporting files.

Follow Anthropic's recommendation to keep the `SKILL.md` body under 500
lines. This is an upper limit, not a target. Keep essential rules and routing
in the entrypoint, with conditional details in references. All consumer
references are linked directly from it; references longer than 100 lines
have a contents list. Read supporting files only as needed.

Keep the skill focused on using Walk. Generic programming lessons, copied
manuals, promotional claims, and maintainer procedures do not belong in the
consumer entrypoint. Keep examples consistent with the library's code style.

## Quality checks

After API changes, verify the skill against `src/main.js`, the instruction
helpers, callback creation, and traversal loop. Run the runnable examples
against the implementation, checking outputs, source preservation, callback
visits, and reference identity rather than only matching text.

Evaluate selection and answers separately. Use these realistic prompts:

| Prompt | Expected selection and behaviour |
| --- | --- |
| “Use Walk to copy an API response and remove passwords at every depth.” | Select `walk`; leaf callback returns `IGNORE()`; preserve source |
| “Skip every metadata branch while scanning; I don't need a copy.” | Select `walk`; `copy:false`; object callback returns `IGNORE()` for metadata and `value` otherwise |
| “Keep a branch's immediate values unchanged but transform nested values.” | Read control-flow reference; local `PASS()`; nested callbacks continue |
| “Replace a branch, skipping only its immediate key callbacks.” | Return `PASS(replacement)`; replacement remains data, not an instruction in the output |
| “Find the first matching leaf and stop without cloning.” | Collect externally with `copy:false`; return `FINISH()`; walk returns `undefined` |
| “Finish on one object, then choose its final leaves.” | Read final-branch rules; `FINISH(value)` plus key callback's `isFinished`; no further object callbacks |
| “A key contains a slash; give me its full path as an array.” | Use `[ ...parentPath, key ]`; never split breadcrumbs |
| “Copy a self-referencing object and two shared branches.” | Ancestor cycle closes inside copy; separate shared branches become distinct copies |
| “Await an HTTP request for each leaf.” | Route to `@peter.naydenov/walk-async`; do not present sync callbacks as awaited |
| “Independently clone the contents of a Map.” | Do not select this skill for built-in cloning; explain Walk's reference contract if asked |

For selection evaluation, expose only the skill name and description first.
For answer evaluation, expose the skill and let the agent choose references.
Record which files it reads and check the generated code's observable result.
Run these prompts with the target agents/models when available. Executable
examples verify API accuracy but do not prove automatic selection quality.

Do not change `package.json`, commit, or publish as part of maintaining the
skill unless separately requested.
