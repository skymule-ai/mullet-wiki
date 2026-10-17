---
title: Home
hide:
  - toc
---

<div class="stack-home" markdown="0">
  <header class="stack-hero">
    <img class="stack-logo" src="assets/logos/skymule_full_black.svg#only-light" alt="Skymule">
    <img class="stack-logo" src="assets/logos/skymule_full_white.svg#only-dark" alt="Skymule">
    <p class="stack-kicker">ROS 2 Jazzy · PX4 1.17</p>
    <h1>MULLET</h1>
    <p class="stack-lead">An autonomy stack for PX4 multicopters, run from a Jetson Orin. Select a block to see what it does and what it connects to.</p>
    <nav class="stack-field" aria-label="On Field">
      <span>On Field</span>
      <a href="on-field/">Flight day</a>
      <a href="on-field/paddock/">Paddock</a>
      <a href="on-field/mission-builder/">Mission Builder</a>
      <a href="on-field/fsm/">Supervisor states</a>
      <a href="on-field/frameworks/">Running a framework</a>
    </nav>
  </header>
  <div class="stack-stage">
    <div class="stack-scene" id="stack-scene" data-src="assets/stack.json">
      <svg class="stack-edges" id="stack-edges" aria-hidden="true"></svg>
      <div class="stack-iso" id="stack-iso"></div>
    </div>
    <aside class="stack-inspector" id="stack-inspector" aria-live="polite"></aside>
  </div>
</div>

Move between blocks with Tab, or press 1 to 9 to jump to one.

<div class="grid cards" markdown>

- **Fly it.** Bring the stack up, fly a mission and read what refuses: [On Field](on-field/index.md).
- **Build on it.** How the layers divide control, the frames and names everything uses, and one page per repository: [Architecture](concepts/architecture.md), [Conventions](concepts/conventions.md), [Stack](stack/index.md).
- **Research on it.** The framework contract, the ergodic controller's formulation, and projects waiting for someone to take them: [Frameworks](frameworks/index.md), [Projects](projects/index.md).

</div>
