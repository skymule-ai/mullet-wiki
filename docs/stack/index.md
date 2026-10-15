# Stack

MULLET is the SkyMule drone stack: ROS 2 **Jazzy**, PX4 **1.17.x**, Fast DDS (`rmw_fastrtps_cpp`), typically `FASTDDS_BUILTIN_TRANSPORTS=UDPv4`.

The browser never talks to PX4. Command path:

```text
Browser → paddock gateway → mullet_interfaces → mullet_core → PX4
```

Mission frameworks (today: [ergodic MPPI](../frameworks/ergodic-mppi.md)) sit beside core. They stream `MissionCommand` while the supervisor is in `MISSION`. They never publish `/fmu/in/*`.

## Who owns what

| Repo | Role |
| --- | --- |
| [mullet-interfaces](interfaces.md) | IDL wire contract |
| [mullet-core](core.md) | Onboard offboard supervisor |
| [mullet-paddock](paddock.md) | Operator UI + ROS 2 gateway |
| [mullet-sim](sitl.md) | Multi-vehicle SITL fleet |
| [mullet-base](ros-base.md) | Jetson Orin ROS 2 / CUDA image |

## Domains and names

| | Sim | Aircraft (example) |
| --- | --- | --- |
| `ROS_DOMAIN_ID` | `42` | `99` |
| drone id | `uav_N` | from heartbeat |
| PX4 `UXRCE_DDS_DOM_ID` | same as ROS | same as ROS |

Instance `N` with `namespace_prefix: uav` → topics `/uav_N/...`, `target_system = N+1`. Instance `0` uses bare `/fmu/...`.

## Images

| Image | From |
| --- | --- |
| `ghcr.io/skymule-ai/px4-sitl:v1.17.0` | mullet-sim (`image/`) |
| `ghcr.io/skymule-ai/mullet-ros2-base:v0.5.0` | mullet-base (Jazzy; `v0.4.0` and older are Humble) |
| `mullet-core` drone image | `mullet-core/docker` `FROM` ros_base |

Pin immutable tags on aircraft. `:main` is integration only.
