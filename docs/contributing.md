# Writing for this wiki

These rules keep the wiki readable as more people edit it. Read them before your first change.

## Prose

- Write full sentences, with a subject and a verb. "Core holds after 0.25 s" is a sentence; "stale → hold" is not.
- Define a term the first time a page uses it, or link it to the [glossary](concepts/glossary.md).
- Prefer the concrete statement to the general one: "the supervisor holds the drone in place" rather than "the system ensures safety".
- Do not write filler: no "simply", "just", "note that", "it is important to", "seamless", "robust" or "powerful".
- A page states each fact once. If a fact belongs to another page, link to that page; do not restate it. A fact repeated in two places is wrong in one of them sooner or later.

## Names

Each thing has one name, and that name is used everywhere.

| Thing | Write | Not |
| --- | --- | --- |
| The repository | mullet-core | Core, mullet_core repo |
| The ROS 2 package and node | `mullet_core` | mullet-core node |
| Its role | the supervisor | the FSM, core |
| The operator console | Paddock | paddock, the UI, the control center |
| A mission planner node | a framework (in full: mission framework) | planner, mission node |
| The flight controller software | PX4 | the autopilot, FCU |
| The companion computer | the Orin | the Jetson, the drone computer |

Supervisor states are written in code font and upper case: `IDLE`, `TRANSITION`, `HOLD`, `MISSION`. Paddock buttons are bold, as they appear on screen: **Start mission**.

## Notation

- Use SI units with their symbols, and a space between number and unit: `2 m/s`, `0.25 s`, `50 Hz`.
- Name the frame of every coordinate: PX4 local NED, WGS84 or body FRD. The frames are defined in [Conventions](concepts/conventions.md).
- Write equations in LaTeX between `$…$` (inline) or `$$…$$` (display), and define every symbol in a table right after the equation.
- Use code font only for literal text: identifiers, topics, parameters, file paths, commands and values. Do not use it for emphasis.

## Layout

- Every table has a header row with a label in every column.
- Arrows belong in diagrams, never in sentences. Draw diagrams in Mermaid.
- Use bold only for UI buttons and for at most one warning per page. Use an admonition (`!!! warning`) when a mistake can damage hardware or hurt someone.
- Put commands in fenced blocks tagged `bash`, one task per block, with no `$` prompt.

## Page templates

Use the template that matches the page's section.

**On Field (operator procedures):** one sentence on what the page is for, then *Before you start*, *Steps* (numbered), *Check* and *Troubleshooting* (a table with the columns Symptom, Cause and Fix).

**Stack (one page per repository):** one paragraph on what the repository is and who uses it, then *Interfaces* (a table with Direction, Name, Type and Rate), *Configuration*, *Build and run*, and *Source of truth*, which links to the repository's own documentation.

**Concepts:** start from the question the page answers, and keep it independent of any one repository.

**Projects:** use the template on the [Projects](projects/index.md) page.

## Checking a change

Every fact must come from the source repository: the README, the parameter YAML, the `.msg` file or the compose file. When a value is shipped in a config file, quote that file's value and name the file.

Preview with `./wiki`, then run the same build as CI before you push:

```bash
uv run --with-requirements requirements.txt mkdocs build --strict
```

A push to `main` publishes the site.
