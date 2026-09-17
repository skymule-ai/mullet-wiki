# mullet-core

C++ ROS 2 package `mullet_core`: soft real-time PX4 **offboard supervisor** for multicopters.

Repo: [skymule-ai/mullet-core](https://github.com/skymule-ai/mullet-core) · maintainer docs in that repo's `docs/`

PX4 remains the hard RT controller (attitude, mixing, motors, failsafes). The e-stop is the **RC kill switch**. Core never fights PX4: an external disarm or a leave-Offboard ends the current action.

```text
IDLE --takeoff--> TRANSITION --settled--> HOLD <--start_mission / hold--> MISSION
HOLD or MISSION --return_home--> TRANSITION --arrived--> HOLD
anything armed --land--> TRANSITION --disarmed--> IDLE
```

Launch is passive: `IDLE` does not arm or request Offboard until `Takeoff` is accepted.

## ROS surface

| | Name |
| --- | --- |
| pub | `/fmu/in/offboard_control_mode`, `trajectory_setpoint`, `vehicle_command` |
| sub | `/fmu/out/vehicle_local_position_v1`, `vehicle_status_v1`, `vehicle_land_detected` |
| pub | `/mullet/heartbeat` (`DroneHeartbeat` schema 3) |
| sub | `<ns>/command` (`MissionCommand`) |
| actions | `<ns>/{takeoff,land,return_home}` |
| services | `<ns>/{start_mission,hold}` (`Trigger`) |

PX4 1.17 versioned topics get a `_v<N>` suffix. Instance `0` uses bare `/fmu/...`. Instance `N` with prefix `uav` uses `/uav_N/fmu/...`, `target_system = N+1`.

`MISSION` modes: `VELOCITY` / `ACCELERATION` (planar, z latched) and `VELOCITY_3D` / `ACCELERATION_3D`. Stale commands → hold in place, stay in `MISSION`.

## Dev

```bash
colcon build --packages-select mullet_core --symlink-install
source install/setup.bash
ros2 launch mullet_core mullet_core.launch.py
```

Launch reads `config/mullet_core_params.yaml` only. Set `vehicle_instance` and `px4_namespace_prefix` there. One YAML per drone.

## Aircraft

Image builds on `mullet-ros2-base` and compiles sibling `mullet-interfaces`. `UXRCE_DDS_DOM_ID` must equal `ROS_DOMAIN_ID`.

```bash
cd docker
cp .env.example .env
docker compose up -d --build
```

Edit `config/mullet_core_params.yaml`, then `docker compose restart mullet_core`.

```bash
ros2 action send_goal /uav_1/takeoff mullet_interfaces/action/Takeoff "{altitude_m: 2.0, yaw_rad: 0.0, use_current_yaw: true}" --feedback
ros2 service call /uav_1/start_mission std_srvs/srv/Trigger
ros2 service call /uav_1/hold std_srvs/srv/Trigger
ros2 action send_goal /uav_1/return_home mullet_interfaces/action/ReturnHome "{}" --feedback
ros2 action send_goal /uav_1/land mullet_interfaces/action/Land "{}" --feedback
```

Bare names if `vehicle_instance: 0`.
