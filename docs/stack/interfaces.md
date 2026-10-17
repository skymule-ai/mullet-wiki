# mullet-interfaces

mullet-interfaces is a ROS 2 package of message, service and action definitions, with no code that runs. It is the contract between Paddock, the supervisor and the frameworks: every other repository builds against it, so a change here changes what they can say to each other.

Repository: [skymule-ai/mullet-interfaces](https://github.com/skymule-ai/mullet-interfaces)

## Definitions

| File | Kind | Purpose |
| --- | --- | --- |
| `action/Takeoff.action` | action | Take off to an altitude above the takeoff point, then hold. |
| `action/Land.action` | action | Land and disarm. The only land command. |
| `action/ReturnHome.action` | action | Fly back above the takeoff point and hold. |
| `msg/DroneHeartbeat.msg` | message | The complete status of one drone, schema version 3. |
| `msg/MissionCommand.msg` | message | The setpoint a framework streams in `MISSION`. |
| `msg/MissionStatus.msg` | message | The status and preflight of one framework on one drone. |
| `msg/LocalizationStatus.msg` | message | Which sources PX4's EKF2 is fusing: GNSS, vision, magnetometer, barometer, range finder. |
| `srv/LoadMission.srv` | service | Validate and prepare a mission. It never starts one. |
| `srv/ListMissions.srv` | service | Every spec a framework has accepted on this drone, newest first. |

**Start mission** and **Hold** are `std_srvs/srv/Trigger` services, so they need no definition here. Their full names are in the heartbeat.

## Producers and consumers

| Topic or service | Type | Producer | Consumers | Rate |
| --- | --- | --- | --- | --- |
| `/mullet/heartbeat` | `DroneHeartbeat` | `mullet_core` | Paddock, frameworks | 10 Hz |
| `/mullet/localization_status` | `LocalizationStatus` | `mullet_core` | Paddock | 1 Hz |
| `<namespace>/command` | `MissionCommand` | a framework | `mullet_core` | about 50 Hz |
| `/mullet/mission_status` | `MissionStatus` | each framework | Paddock | 2 Hz |
| `<namespace>/takeoff`, `land`, `return_home` | actions | `mullet_core` | Paddock | — |
| `<namespace>/start_mission`, `hold` | `Trigger` | `mullet_core` | Paddock, frameworks | — |
| the framework's load and list paths | `LoadMission`, `ListMissions` | each framework | Paddock | — |

`<namespace>` is empty on the aircraft and `/uav_N` in the simulator (see [Conventions](../concepts/conventions.md#vehicle-instances-and-names)).

Match supervisor states by the heartbeat's `state_label` (`IDLE`, `TRANSITION`, `HOLD`, `MISSION`), not by the numeric `state` field: the numbers may change, the labels will not.

## Changing the contract

A field is not real until its producer fills it. A field declared here but never assigned by the supervisor reaches consumers as zero or empty, which they cannot tell apart from a genuine value. So a change lands in three repositories, in this order:

1. Declare the field or action here, with its meaning and unit in a comment.
2. `mullet_core` fills the field (or serves the action) and, for `DroneHeartbeat`, raises `schema_version`.
3. Consumers read it. In Paddock, that is `models.py`, `droneTypes.ts`, and the component that shows it.

## Build

```bash
colcon build --packages-select mullet_interfaces
source install/setup.bash
ros2 interface show mullet_interfaces/msg/DroneHeartbeat
```

Paddock keeps its own checkout at `gateway/vendor/mullet_interfaces`, and frameworks carry it as a git submodule. Update those copies before rebuilding the gateway or a framework image.
