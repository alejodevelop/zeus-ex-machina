# Game Direction

## Summary
- Jam theme is `machines`.
- The agreed direction is a machine-maintenance game, not a kitchen game.
- The setting is inside a giant machine that keeps `Nutcity` alive.
- Player characters are robotic operators called `NutGuys`.
- A run is framed as a work shift where one `NutGuy` keeps the machine from collapsing until the next worker relieves them.
- Current full-shift target is about `120 seconds`, subject to tuning during prototyping.

## Planned Systems
- Planned alert-driven failures are `battery replacement`, `cracks`, `oiling`, and `intelligence`.
- `Battery replacement` is the first vertical slice because it best establishes the alert -> move -> carry -> replace loop.
- Likely implementation order after batteries is `cracks`, then `oiling`, then `intelligence`.
- `Cracks` can block traversal and are resolved by welding a plate over them.
- `Battery replacement` removes depleted batteries and installs replacements.
- `Oiling` lubricates moving parts such as gears.
- `Intelligence` removes a memory module from the main computer, refills it at an intelligence station, then returns it.

## Decisions
- Target feel is Overcooked-like urgency and prioritization, but expressed through machine maintenance and emergency response.
- Carrying an object should disable dash so dash stays useful for reaching emergencies without trivializing transport.

## Current State
- None of the maintenance systems are implemented yet.
- The repo currently contains only the movement and dash prototype foundation.

## Follow-ups
- Use `battery replacement` to define the first end-to-end alert, pickup, carry, and replace interaction loop before layering later hazards.
