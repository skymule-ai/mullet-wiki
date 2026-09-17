# Ergodic MPPI

JAX service-gated potential-gradient MPPI for single-UAV ergodic coverage of a GMM density. On the drone it is one MULLET **mission framework**.

Repo: **`skymule-ai/ergodic_mppi`** — the `mullet-deploy` tree (controller + `deploy/` + `ros2/ergodic_mission` + Jetson image). Algorithm research stays on `main` of the personal research repo; this wiki tracks the drone slice.

```text
paddock  --LoadMission-->  ergodic_mission  --MissionCommand-->  mullet_core  -->  PX4
```

`mullet_core` owns arming, Offboard, takeoff, land and hold. This node never talks to `/fmu/in/*`.

## Spec `ergodic/3`

Paddock's Mission Builder draws it. Points are WGS84; sizes in metres. `command_mode`:

| Mode | Motion |
| --- | --- |
| `velocity` / `acceleration` | planar, altitude held by core |
| `velocity_3d` / `acceleration_3d` | x, y, z; fly over obstacles shorter than `height_m` |

At load, the node projects into PX4 local NED around the EKF origin. If PX4 moves that origin, reload.

Node param that matters: `drone_id`. Other names come from that drone's heartbeat.

| | Name |
| --- | --- |
| sub | `/mullet/heartbeat`, `<fmu>/fmu/out/vehicle_local_position` |
| pub | `<ns>/command`, `/mullet/mission_status` @ 2 Hz |
| srv | `<ns>/mission/ergodic/load`, `.../list` |

States: `SELF_TEST → EMPTY → PREPARING → READY → RUNNING ⇄ PAUSED → DONE`, or `FAULT`. Nothing is `READY` until build, boot self-test, load (spec + GPU deadline + dry run) all pass. Start also requires the drone inside free space connected to the density modes.

## SITL

Needs `mullet_sitl_sim` headless and a `mullet_core` that serves `VELOCITY_3D`.

```bash
../mullet_sitl_sim/run.sh --headless --config config/paddock.yaml --domain 42
docker run --rm --network host -e ROS_DOMAIN_ID=42 \
  ergodic-mission:latest python /workspace/tests/sitl/sitl_e2e.py --drone uav_1
```

Laptop GPU often misses the 16 ms gate. Flow-only: `-p deadline_ms:=150.0`.

## Aircraft (Orin)

Image `FROM mullet-ros2-base` (arm64), NVIDIA runtime. Match `DRONE_ID` and `ROS_DOMAIN_ID` to `mullet_core`.

```bash
rsync -az --delete --exclude-from=.dockerignore ./ orin:ergodic_mppi/
ssh orin 'cd ergodic_mppi/docker/mission && cp -n .env.example .env && docker compose up -d --build'
ssh orin 'docker logs -f ergodic-mission'
```

```bash
JAX_PLATFORMS=cpu uv run python -m unittest discover -s tests -v
```

Clone with `--recursive` (`ros2/mullet-interfaces` submodule).
