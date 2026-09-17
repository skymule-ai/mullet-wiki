# mullet-interfaces

Shared ROS 2 IDL. This is the wire contract every other MULLET repo builds against. No runtime, no policy.

Repo: [skymule-ai/mullet-interfaces](https://github.com/skymule-ai/mullet-interfaces)

## Contents

```text
action/Takeoff.action      takeoff to altitude and hold
action/Land.action         land and disarm (the only land command)
action/ReturnHome.action   fly back above takeoff and hold
msg/DroneHeartbeat.msg     full per-drone snapshot, schema_version 3
msg/MissionCommand.msg     setpoint a framework streams in MISSION
msg/MissionStatus.msg      per-framework mission + preflight
srv/LoadMission.srv        validate and prepare (never starts)
srv/ListMissions.srv       specs this framework accepted on the drone
```

`start_mission` and `hold` are `std_srvs/Trigger`. Paths are in the heartbeat.

Supervisor labels: `IDLE`, `TRANSITION`, `HOLD`, `MISSION`. Match `state_label`, not the numeric enum.

## Sides

- **core** is the sole producer of `DroneHeartbeat` (`/mullet/heartbeat` @ 10 Hz) and the action/service servers.
- **paddock** consumes heartbeats and calls those servers.
- **frameworks** produce `MissionCommand` for core, and `MissionStatus` / `LoadMission` / `ListMissions` for paddock.

A field is not real until core assigns it. Change order: IDL → core populates → consumer reads.

`can_*` flags on the heartbeat are the same predicates core uses to accept a command.

## Build

```bash
colcon build --packages-select mullet_interfaces
source install/setup.bash
ros2 interface show mullet_interfaces/msg/DroneHeartbeat
```

Paddock vendors a checkout at `gateway/vendor/mullet_interfaces`. Update it before rebuilding the gateway image.
