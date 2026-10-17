# On Field

How to fly MULLET, step by step. For what each repo is and why, see [Stack](../stack/index.md).

!!! danger "Two rules that never change"
    **The e-stop is the RC kill switch.** Nothing in paddock or core replaces it.
    **Land is the only way down.** It works from any armed state and cannot be cancelled.

<div class="grid cards" markdown>

- [**Paddock**](paddock.md): bring up the gateway and the UI, find the drone, use the five buttons.
- [**Mission Builder**](mission-builder.md): draw an `ergodic/3` mission, deploy it, reload an earlier one.
- [**FSM**](fsm.md): what each state allows, what ends it, and what PX4 can override.
- [**Frameworks**](frameworks.md): run the ergodic node on the Orin and read its preflight.

</div>

## Flight day

Do the steps in this order. Each one depends on the step before it.

| # | Do | Check |
| --- | --- | --- |
| 1 | Pin the images: `mullet-base:v0.5.1`, PX4 1.17.x on the Pixhawk | never `:main` on the aircraft |
| 2 | Use one domain everywhere: core `.env`, mission `.env`, paddock `.env.ros2`, PX4 `UXRCE_DDS_DOM_ID` | all `99` (aircraft) or `42` (SITL) |
| 3 | **Core** up on the Orin: `mullet-core/docker` → `docker compose up -d` | `ros2 topic echo /mullet/heartbeat --once` |
| 4 | **Framework** up: `docker/mission` → `docker compose up -d`, then `sudo nvpmodel -m 2` | mission status `EMPTY` |
| 5 | **Paddock** on the laptop: `make ros2-dev` + `make frontend-dev` | `uav_0` listed, then **Connect** |
| 6 | **Offline map**: Mission Builder → *Download this area* while you still have internet | tiles cached |
| 7 | **Takeoff** | `TRANSITION` → `HOLD` |
| 8 | **Load** the mission from the Builder | preflight runs → `READY` |
| 9 | **Start mission** | `MISSION`, framework `RUNNING` |
| 10 | **Hold** / **Return home** when needed; **Start mission** again resumes | `HOLD`, framework `PAUSED` |
| 11 | **Land** | `IDLE` once PX4 disarms |

## If → then

| If | Then |
| --- | --- |
| No drone in paddock | Domain mismatch or core not running. Check step 2, then step 3. |
| Start mission greyed out | The framework is not `READY`. Read its preflight lines in the panel. |
| Drone holds in `MISSION` without moving | The command stream is stale: the framework stopped publishing. Check `docker logs ergodic-mission`. |
| Pilot flipped out of Offboard | Core drops to a passive `HOLD`. Switch back to Offboard to resume control, or Land. |
