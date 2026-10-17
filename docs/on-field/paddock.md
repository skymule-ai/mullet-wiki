# Paddock

Paddock is the ground station: a web UI and a gateway that turns the operator's clicks into ROS 2 actions and service calls. The browser never talks to ROS 2 or PX4 directly. For the repository itself, see [mullet-paddock](../stack/paddock.md).

## Before you start

- The gateway's copy of the interface definitions is current: `git -C gateway/vendor/mullet_interfaces pull --ff-only`.
- `.env.ros2` sets `ROS_DOMAIN_ID` to the drone's domain (see [Conventions](../concepts/conventions.md#ros-2-domain)).
- The field's map is cached. Open the [Mission Builder](mission-builder.md) and use **Download this area** while you have internet.

## Start Paddock

=== "Aircraft"

    ```bash
    cp .env.ros2.example .env.ros2   # set ROS_DOMAIN_ID=99
    make ros2-dev
    ```

    In a second terminal:

    ```bash
    make frontend-dev                # serves http://localhost:5173
    ```

=== "Simulator"

    ```bash
    cp .env.ros2.example .env.ros2   # ROS_DOMAIN_ID=42
    make sim-dev                     # headless uav_1 and uav_2, then the gateway
    ```

    In a second terminal:

    ```bash
    make frontend-dev
    ```

    Stop everything with `make sim-down`.

## Check

```bash
curl -s localhost:8000/api/health
curl -s localhost:8000/api/drones
```

The second command lists `uav_0` on the aircraft, or `uav_1` and `uav_2` in the simulator. In the UI, select the drone and press **Connect**. Connecting only starts monitoring: it never arms the drone or sends PX4 a command.

## Fly

Paddock has five command buttons. A button is enabled only when the heartbeat's matching capability flag says the supervisor will accept that command. What each command does in each state is described in [Supervisor states](fsm.md).

| Button | Enabled when | Result |
| --- | --- | --- |
| **Takeoff** | `IDLE`, disarmed, telemetry valid | climbs to the requested altitude, then `HOLD` |
| **Start mission** | `HOLD`, and a framework on the drone reports `READY` (or `PAUSED`, to resume) | `MISSION` |
| **Hold** | `MISSION`, or during a return home | `HOLD` at the current position |
| **Return home** | `HOLD` or `MISSION`, with PX4 in Offboard | flies above the takeoff point at the current altitude, then `HOLD` |
| **Land** | any armed state | lands and disarms, then `IDLE` |

The map shows each drone as an arrow pointing along its heading, with a trail of roughly the last two minutes. Click an arrow to select that drone.

## Record a flight

The **Record** button, below the five command buttons, starts and stops the drone's flight recorder. It works in every state, so press it before takeoff. It needs the recorder running on the drone, which you start once:

```bash
mkdir -p ~/flights && cd ~/ergodic_mppi/docker/mission && docker compose up -d recorder
```

The recorder keeps one row per mission command, so it writes nothing until a mission streams. **Stop recording** writes the run to `~/flights/<UTC stamp>/` on the drone: the flight log, each flown spec, `viewer.html` and `tracking.txt`. The event log shows where. A stop with no mission flown saves nothing. To copy a run to the laptop, from an `ergodic_mppi` checkout:

```bash
tests/sitl/fetch_sih.sh flights/<UTC stamp>
```

## Without the UI

Every button is a REST call on the gateway:

```bash
curl -sX POST localhost:8000/api/drones/uav_0/takeoff -H 'content-type: application/json' -d '{"altitude_m": 3.0}'
curl -sX POST localhost:8000/api/drones/uav_0/start-mission
curl -sX POST localhost:8000/api/drones/uav_0/hold
curl -sX POST localhost:8000/api/drones/uav_0/return-home
curl -sX POST localhost:8000/api/drones/uav_0/land
curl -s localhost:8000/api/drones/uav_0/missions
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `/api/drones` is empty. | The domains differ, or `mullet_core` is not running. It is never a gateway bug. | Check `ROS_DOMAIN_ID`, then the supervisor container. |
| A drone disappears. | Paddock received no heartbeat for 1 s. | Check the radio link, the Orin and the supervisor container. |
| A command returns `accepted: false`. | The supervisor refused it, usually because of the state. The HTTP status is still 200. | Read `message`. |
| **Takeoff** returns HTTP 422. | The JSON body is missing `altitude_m`. | Send `{"altitude_m": 3.0}`. |
| The UI shows "Unknown state" or a schema warning. | Paddock and the supervisor use different interface versions. | Update `gateway/vendor/mullet_interfaces` and rebuild the gateway. |
| Heartbeats are discovered but no data arrives. | Fast DDS fell back to shared memory. | Keep `FASTDDS_BUILTIN_TRANSPORTS=UDPv4`, the compose default. |
