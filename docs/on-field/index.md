# On Field

This section is for the people flying the drone. It covers bringing the stack up, flying a mission, and what to do when something refuses. For what each component is and why it exists, read [Architecture](../concepts/architecture.md).

!!! danger "Two rules that never change"
    The emergency stop is the RC kill switch. Nothing in Paddock or the supervisor replaces it.

    **Land** is the only way down. It works from any armed state, and once it is accepted it cannot be cancelled.

<div class="grid cards" markdown>

- [**Paddock**](paddock.md): start the ground station, find the drone, and use the five command buttons.
- [**Mission Builder**](mission-builder.md): draw a mission on the map, deploy it, and reload an earlier one.
- [**Supervisor states**](fsm.md): what each state accepts, what ends it, and when PX4 takes over.
- [**Running a framework**](frameworks.md): start the ergodic framework on the Orin and read its preflight.

</div>

## Flight day

Do these steps in order. Each one assumes the one before it worked.

| Step | Do | Check |
| --- | --- | --- |
| 1 | Confirm the versions: the Orin's images are pinned to immutable tags, and the Pixhawk runs PX4 v1.17.0. | No image uses `:main`. |
| 2 | Confirm every component uses the same ROS 2 domain (the five places are listed in [Conventions](../concepts/conventions.md#ros-2-domain)). | All of them say `99`. |
| 3 | On the Orin, check the PX4 parameters: `cd ~/mullet-px4 && scripts/set-profile.py --show`. | The expected localization profile, with no drift. |
| 4 | Start the supervisor: `cd mullet-core/docker && docker compose up -d`. | `ros2 topic echo /mullet/heartbeat --once` prints a heartbeat. |
| 5 | Start the framework and set the Orin to full power. See [Running a framework](frameworks.md#start-it-on-the-orin). | Its status is `EMPTY`. |
| 6 | Start Paddock on the laptop (see [Paddock](paddock.md#start-paddock)). | `uav_0` is listed. Press **Connect**. |
| 7 | While you still have internet, cache the map: Mission Builder, **Download this area**. | The tiles are cached. |
| 8 | Press **Takeoff**. | The state goes from `TRANSITION` to `HOLD`. |
| 9 | Deploy the mission from the Mission Builder. | The preflight runs and the framework reports `READY`. |
| 10 | Press **Start mission**. | The supervisor is in `MISSION` and the framework is `RUNNING`. |
| 11 | Press **Hold** or **Return home** when needed. **Start mission** resumes. | The supervisor is in `HOLD` and the framework is `PAUSED`. |
| 12 | Press **Land**. | The state reaches `IDLE` once PX4 disarms. |

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| No drone appears in Paddock. | The domains differ, or the supervisor is not running. | Repeat step 2, then step 4. |
| **Start mission** is greyed out. | The framework is not `READY`. | Read its preflight lines in the mission panel. |
| The drone holds in `MISSION` without moving. | The framework stopped streaming commands. After 2 s the supervisor drops to `HOLD`. | Check `docker logs ergodic-mission`. |
| The pilot switched out of Offboard. | The supervisor dropped to a passive `HOLD`. | Switch back to Offboard to resume, or press **Land**. |
