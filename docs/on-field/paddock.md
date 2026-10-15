# Paddock

The operator UI and the gateway. The browser never talks ROS 2 or PX4 directly. Details: [mullet-paddock](../stack/paddock.md).

## Before you go

- `gateway/vendor/mullet_interfaces` is up to date: `git -C gateway/vendor/mullet_interfaces pull --ff-only`.
- `.env.ros2` sets `ROS_DOMAIN_ID` to the drone's domain.
- The field map is cached: open the [Mission Builder](mission-builder.md) and use **Download this area**.

## Bring up

=== "Aircraft"

    ```bash
    cp .env.ros2.example .env.ros2   # ROS_DOMAIN_ID=99
    make ros2-dev
    make frontend-dev                # another terminal → http://localhost:5173
    ```

=== "SITL"

    ```bash
    cp .env.ros2.example .env.ros2   # ROS_DOMAIN_ID=42
    make sim-dev                     # headless uav_1, uav_2 + gateway
    make frontend-dev
    make sim-down                    # when done
    ```

Then check, in this order:

```bash
curl -s localhost:8000/api/health
curl -s localhost:8000/api/drones    # uav_0 on the aircraft, uav_1 / uav_2 in SITL
```

Select the drone and press **Connect**. Connecting only starts monitoring: it never arms and never sends a PX4 command.

## Fly

Five buttons. A button is enabled only when the heartbeat's `can_*` flag says core will accept that command.

| Button | Enabled in | Result |
| --- | --- | --- |
| **Takeoff** | `IDLE`, disarmed, telemetry valid | climbs, then `HOLD` |
| **Start mission** | `HOLD` + a framework `READY` (or `PAUSED`) | `MISSION` |
| **Hold** | `MISSION`, or return home in progress | `HOLD` in place |
| **Return home** | `HOLD` / `MISSION`, in Offboard | flies over the takeoff point at the current altitude, then `HOLD` |
| **Land** | anything armed | lands, disarms, `IDLE` |

**Record** (under the five) starts and stops the drone's flight recorder. It needs the recorder
running on the drone (`docker compose up -d recorder` in `ergodic_mppi/docker/mission`) and works in
any state: press it before takeoff. It keeps one row per mission command; **Stop recording** writes
`~/flights/<UTC stamp>/` on the drone (log, spec, `viewer.html`, `tracking.txt`) and the event log says
where. A stop with no mission flown saves nothing. Fetch a run from an `ergodic_mppi` clone:
`tests/sitl/fetch_sih.sh flights/<stamp>`.

The map shows each drone as a heading arrow with a trail of about the last 2 minutes. Click an arrow to select that drone.

## Without the UI

```bash
curl -sX POST localhost:8000/api/drones/uav_0/takeoff -H 'content-type: application/json' -d '{"altitude_m": 3.0}'
curl -sX POST localhost:8000/api/drones/uav_0/start-mission
curl -sX POST localhost:8000/api/drones/uav_0/hold
curl -sX POST localhost:8000/api/drones/uav_0/return-home
curl -sX POST localhost:8000/api/drones/uav_0/land
curl -s  localhost:8000/api/drones/uav_0/missions
```

## If → then

| If | Then |
| --- | --- |
| `/api/drones` is empty | `ROS_DOMAIN_ID` mismatch, or `mullet_core` is not running. This is never a gateway bug. |
| The drone disappears | No heartbeat for 1 s: check the link, the Orin, and the core container. |
| A command comes back `accepted: false` | It is still HTTP 200; the `message` says why (for example, the wrong state). |
| Takeoff returns 422 | The JSON body `{"altitude_m": …}` is missing. |
| "Unknown state" or a schema warning | Paddock and core are out of step. Update the vendored interfaces and rebuild the gateway. |
| Heartbeats seen but no samples arrive | Keep `FASTDDS_BUILTIN_TRANSPORTS=UDPv4` (the compose default). |
