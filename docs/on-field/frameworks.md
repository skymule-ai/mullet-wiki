# Frameworks

A mission framework flies the drone only while core is in `MISSION`. Ergodic MPPI is the only framework today. Details: [Frameworks](../frameworks/index.md), [Ergodic MPPI](../frameworks/ergodic-mppi.md).

## Before you go

- The image builds cleanly. A build that fails its tests produces no image.
- `docker/mission/.env` uses the same values as core: `DRONE_ID=uav_0`, `ROS_DOMAIN_ID` = core's.
- Core's clamps are at least as high as the spec limits (see [FSM → Field parameters](fsm.md#field-parameters)).

## Deploy on the Orin

```bash
ssh orin 'git clone --recursive git@github.com:skymule-ai/ergodic_mppi.git'   # once
ssh orin 'cd ergodic_mppi && git pull --recurse-submodules && cd docker/mission && cp -n .env.example .env && docker compose up -d --build'
ssh orin 'sudo nvpmodel -m 2'          # MAXN_SUPER: the GPU holds the 16 ms gate
ssh orin 'docker logs -f ergodic-mission'
```

## Status ladder

```text
SELF_TEST → EMPTY → PREPARING → READY → RUNNING ⇄ PAUSED → DONE
                                   └──────────── FAULT ────────────┘
```

| Status | Meaning | You do |
| --- | --- | --- |
| `SELF_TEST` | CPU boot checks | wait |
| `EMPTY` | nothing loaded | deploy from the [Mission Builder](mission-builder.md) |
| `PREPARING` | preflight running (about 20 s dry run) | wait, watch the lines |
| `READY` | safe to start | **Start mission** |
| `RUNNING` | streaming commands at about 50 Hz | watch, **Hold** at any time |
| `PAUSED` | FSM left `MISSION`; coverage memory is kept | **Start mission** resumes |
| `DONE` | `duration_s` reached, drone held | **Return home** / **Land** |
| `FAULT` | refused, or aborted in flight (hold already called) | read `detail` + preflight |

## Preflight lines

The panel shows each check as `<check>: ok` or `<check>: FAIL <reason>`.

| Check | FAIL means | Fix |
| --- | --- | --- |
| boot | a self-test module failed | rebuild the image; every load is refused until then |
| `spec` | invalid spec, or a density mode not free and not connected to the heaviest mode | fix it in the Builder |
| `device` | step p99 over `deadline_ms` (16 ms) on both GPU and CPU | `nvpmodel -m 2`, check the NVIDIA runtime |
| `dry_run` | the simulated flight entered a margin, left the area, or went too fast | more room around obstacles, fewer or wider blobs |
| start | stale position, EKF origin changed, above the ceiling, or outside free space | fly into the area under the ceiling; reload if the origin moved |

## In flight: automatic hold → `FAULT`

- The EKF origin changes → **reload** the mission.
- The drone goes above `max_altitude_m`.
- The plan for the next second comes within clearance of an obstacle.
- Local position is older than 0.1 s → it stops publishing, and core holds after 0.25 s.

## HIL bench (Orin + Pixhawk in SIH)

1. **Props off.**
2. In QGC: *Parameters → Tools → Save to file*. Then set `SYS_AUTOSTART=1100`, `SYS_HITL=2`, `SIH_LOC_LAT0/LON0/H0` = the lab. Reboot and wait for a 3D fix. With no RC: `COM_RC_IN_MODE=4`.
3. On the Orin: start `mullet-core/docker`, then `~/ergodic_mppi/docker/mission` (`nvpmodel -m 2`), and wait for `EMPTY: self-test passed`.
4. Fly the experiment on the Orin. It records every command, flies the field scene (3 blobs, 6 pillars, 3 of them low enough to fly over) and writes `e2e.log`, `flight.npz`, the specs, `viewer.html` and `tracking.txt`:

    ```bash
    cd ~/ergodic_mppi
    tests/sitl/run_sih.sh ~/hil-flights/field-600s --modes trajectory_3d trajectory --duration 600
    ```

    Pass means the output ends in `RESULT: PASS`. `--duration` is per mission (default 60 s).

5. Look at it on the laptop, from an `ergodic_mppi` clone: `tests/sitl/fetch_sih.sh field-600s` copies the run to `~/sih-flights/field-600s` and opens `viewer.html` (mission dropdown, time slider, drone along its heading). The file opens from disk any time.

6. **Restore** the saved parameters in QGC, then reboot.

## SITL (laptop)

```bash
../MULLET/mullet-sim/run.sh --headless --config config/paddock.yaml --domain 42
docker run --rm --network host -e ROS_DOMAIN_ID=42 \
  ergodic-mission:latest python /workspace/tests/sitl/sitl_e2e.py --drone uav_1
```

A laptop GPU misses the 16 ms gate. For a run that only tests the flow, start the node with `-p deadline_ms:=150.0`.
