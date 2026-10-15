# Ergodic MPPI

JAX service-gated potential-gradient MPPI for single-UAV ergodic coverage of a GMM density. On the drone it is one MULLET **mission framework**.

Repo: **`skymule-ai/ergodic_mppi`** — controller + `deploy/` + `ros2/ergodic_mission` + Jetson image + SITL/SIH tooling. Algorithm research stays in `invidia0/ergodic_control_mppi` (the old `mullet-deploy` branch is tag `mullet-deploy-final` there); this wiki tracks the drone slice.

```text
paddock  --LoadMission-->  ergodic_mission  --MissionCommand-->  mullet_core  -->  PX4
```

`mullet_core` owns arming, Offboard, takeoff, land and hold. This node never talks to `/fmu/in/*`.

## Spec `ergodic/3`

Paddock's Mission Builder draws it. Points are WGS84; sizes in metres; altitudes above the EKF origin. `ergodic/3` adds blob `pitch_deg` / `roll_deg` and `vehicle.max_vertical_speed_mps`. `command_mode`:

| Mode | Motion |
| --- | --- |
| `trajectory` (default) | planar; PX4 tracks the planned position with velocity + accel feedforward, so tracking error is corrected |
| `velocity` / `acceleration` | planar, altitude held by core; replans from each measurement and drifts on PX4 lag |
| `trajectory_3d` / `velocity_3d` / `acceleration_3d` | x, y, z on a 0.5 m voxel grid; fly over obstacles shorter than `height_m` |

Keep `max_speed_mps` ≤ core `max_vx/vy_ned_mps` and `max_vertical_speed_mps` ≤ `max_vz_ned_mps`.

**Mission library.** Every accepted spec is saved to `missions_dir` (`docker/mission/missions` volume) as `<UTC stamp>_<mission_id>.json`; `ListMissions` returns the newest 50.

At load, the node projects into PX4 local NED around the EKF origin. If PX4 moves that origin, reload.

Node param that matters: `drone_id`. Other names come from that drone's heartbeat.

| | Name |
| --- | --- |
| sub | `/mullet/heartbeat`, `<fmu>/fmu/out/vehicle_local_position` |
| pub | `<ns>/command`, `/mullet/mission_status` @ 2 Hz |
| srv | `<ns>/mission/ergodic/load`, `.../list` |
| client | heartbeat `hold_service_path` (on `FAULT` / `DONE`) |

States: `SELF_TEST → EMPTY → PREPARING → READY → RUNNING ⇄ PAUSED → DONE`, or `FAULT`. Nothing is `READY` until build, boot self-test, load (spec + GPU deadline + dry run) all pass. Start also requires the drone inside free space connected to the density modes.

## SITL

Needs `mullet-sim` headless and a `mullet_core` that serves `VELOCITY_3D`.

```bash
../mullet-sim/run.sh --headless --config config/paddock.yaml --domain 42
docker run --rm --network host -e ROS_DOMAIN_ID=42 \
  ergodic-mission:latest python /workspace/tests/sitl/sitl_e2e.py --drone uav_1
```

Laptop GPU often misses the 16 ms gate. Flow-only: `-p deadline_ms:=150.0`.

## Aircraft (Orin)

Image `FROM mullet-ros2-base` (arm64), NVIDIA runtime. Match `DRONE_ID` and `ROS_DOMAIN_ID` to `mullet_core`.

```bash
ssh orin 'git clone --recursive git@github.com:skymule-ai/ergodic_mppi.git'   # once
ssh orin 'cd ergodic_mppi && git pull --recurse-submodules && cd docker/mission && cp -n .env.example .env && docker compose up -d --build'
ssh orin 'docker logs -f ergodic-mission'
```

```bash
JAX_PLATFORMS=cpu uv run python -m unittest discover -s tests -v
```

Clone with `--recursive` (`ros2/mullet-interfaces` submodule).

Status ladder, preflight fixes and the HIL bench: [On Field → Frameworks](../on-field/frameworks.md).
