# mullet-paddock

mullet-paddock is the ground station. It has two parts: a React and Vite web UI, and a FastAPI gateway that talks ROS 2 on the operator's behalf. The UI never publishes to ROS 2 or PX4: it calls the gateway, which calls the supervisor's actions and services. How to use it in the field is on [On Field: Paddock](../on-field/paddock.md).

Repository: [skymule-ai/mullet-paddock](https://github.com/skymule-ai/mullet-paddock)

## Interfaces

| Direction | Name | Type | Notes |
| --- | --- | --- | --- |
| subscribes | `/mullet/heartbeat` | `DroneHeartbeat` | discovers drones; drops one after 1 s of silence |
| subscribes | `/mullet/mission_status` | `MissionStatus` | discovers frameworks |
| subscribes | `/mullet/localization_status` | `LocalizationStatus` | shows which sources EKF2 fuses |
| calls | takeoff, land, return home | actions | names taken from the heartbeat |
| calls | start mission, hold | `std_srvs/Trigger` | names taken from the heartbeat |
| calls | load, list | `LoadMission`, `ListMissions` | names taken from `MissionStatus` |
| serves | HTTP on port 8000 | REST and WebSocket | the gateway API |
| serves | HTTP on port 5173 | web UI | development server |

A command returns as soon as the supervisor accepts or refuses it. A refusal is still HTTP 200, with `accepted: false` and the reason in `message`. Progress arrives through the heartbeat.

## Gateway API

```text
GET  /api/health
GET  /api/drones
GET  /api/drones/{drone_id}
POST /api/drones/{drone_id}/connect
POST /api/drones/{drone_id}/disconnect
POST /api/drones/{drone_id}/takeoff                       body: {"altitude_m": 2.0}
POST /api/drones/{drone_id}/land
POST /api/drones/{drone_id}/return-home
POST /api/drones/{drone_id}/start-mission
POST /api/drones/{drone_id}/hold
GET  /api/drones/{drone_id}/events
GET  /api/drones/{drone_id}/missions
POST /api/drones/{drone_id}/missions/{framework}/load     body: {"spec": {...}}
GET  /api/drones/{drone_id}/missions/{framework}/stored
GET  /api/tiles/{terrain|vector}/{z}/{x}/{y}
POST /api/tiles/prefetch                                  body: {"west", "south", "east", "north"}
WS   /ws/drones
WS   /ws/drones/{drone_id}
```

The gateway refuses **Start mission** until a framework on that drone reports `READY` or `PAUSED`.

## Configuration

| Setting | Where | Meaning |
| --- | --- | --- |
| `ROS_DOMAIN_ID` | `.env.ros2` | the drone's domain (see [Conventions](../concepts/conventions.md#ros-2-domain)) |
| `FASTDDS_BUILTIN_TRANSPORTS` | compose file | `UDPv4`; leave it |
| `MULLET_TILE_CACHE` | environment | where map tiles are cached; `.tile-cache/` in Docker |

The map draws on OpenFreeMap vector tiles and AWS terrain tiles, both cached by the gateway. The optional Esri satellite layer is online only.

## Build and run

There is no mock mode. Development flies the simulator, real PX4 SITL drones each running a supervisor, through the same gateway an aircraft uses. Only `ROS_DOMAIN_ID` differs.

```bash
cp .env.ros2.example .env.ros2
mkdir -p gateway/vendor
git clone git@github.com:skymule-ai/mullet-interfaces.git gateway/vendor/mullet_interfaces
make install
make sim-dev
make frontend-dev
```

`make sim-dev` starts mullet-sim headless with `config/paddock.yaml` (drones `uav_1` and `uav_2` on domain 42), then the gateway. `make ros2-dev` starts only the gateway, for an aircraft. `make test` runs the unit tests, which need no ROS 2.

## Source of truth

The repository's `README.md` and `CLAUDE.md`. Two files are tied to the supervisor's heartbeat and break silently when it changes: `frontend/src/features/drones/stateMachine.ts` (state labels) and `gateway/mullet_control_gateway/adapters/ros2_adapter.py` (heartbeat fields).
