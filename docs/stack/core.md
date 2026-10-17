# mullet-core

mullet-core is the C++ ROS 2 package `mullet_core`, the drone's supervisor. It owns the state machine, serves the takeoff, land and return-home actions, and is the only node that sends setpoints to PX4. PX4 stays responsible for the hard real-time work: attitude control, motor mixing and failsafes. The states and the rules for moving between them are on [Supervisor states](../on-field/fsm.md).

Repository: [skymule-ai/mullet-core](https://github.com/skymule-ai/mullet-core)

## Interfaces

Names are shown for the aircraft (vehicle instance 0). A simulated drone puts `/uav_N` in front of each one; see [Conventions](../concepts/conventions.md#vehicle-instances-and-names).

| Direction | Name | Type | Rate |
| --- | --- | --- | --- |
| publishes | `/fmu/in/offboard_control_mode` | `px4_msgs/OffboardControlMode` | 50 Hz |
| publishes | `/fmu/in/trajectory_setpoint` | `px4_msgs/TrajectorySetpoint` | 50 Hz |
| publishes | `/fmu/in/vehicle_command` | `px4_msgs/VehicleCommand` | on demand |
| subscribes | `/fmu/out/vehicle_local_position_v1` | `px4_msgs/VehicleLocalPosition` | from PX4 |
| subscribes | `/fmu/out/vehicle_status_v1` | `px4_msgs/VehicleStatus` | from PX4 |
| subscribes | `/fmu/out/vehicle_land_detected` | `px4_msgs/VehicleLandDetected` | from PX4 |
| subscribes | `/fmu/out/estimator_status_flags` | `px4_msgs/EstimatorStatusFlags` | from PX4 |
| publishes | `/mullet/heartbeat` | `mullet_interfaces/DroneHeartbeat` | 10 Hz |
| publishes | `/mullet/localization_status` | `mullet_interfaces/LocalizationStatus` | 1 Hz |
| subscribes | `/command` | `mullet_interfaces/MissionCommand` | from the framework |
| serves | `/takeoff`, `/land`, `/return_home` | `mullet_interfaces` actions | — |
| serves | `/start_mission`, `/hold` | `std_srvs/Trigger` | — |

PX4 topics use best-effort, transient-local QoS with a history depth of 1.

## Mission command modes

In `MISSION`, the supervisor forwards the latest `MissionCommand` to PX4 in the PX4 local NED frame. The `mode` field says what PX4 should track.

| Mode | PX4 tracks | Limited by |
| --- | --- | --- |
| `TRAJECTORY` | the planned position, with velocity and optionally acceleration as feedforward | `max_xy_position_lead_m` |
| `VELOCITY` | the velocity, with optional acceleration feedforward | `max_vx_ned_mps`, `max_vy_ned_mps` |
| `ACCELERATION` | the acceleration | `max_accel_ned_mps2`, per axis |
| `TRAJECTORY_3D`, `VELOCITY_3D`, `ACCELERATION_3D` | the same, on all three axes | also `max_vz_ned_mps` and `max_z_position_lead_m` |

<figure class="diagram">
--8<-- "docs/assets/figures/position-lead.svg"
<figcaption>In the trajectory modes the supervisor sends the planned position, but never farther from the drone than <code>max_xy_position_lead_m</code> (1.0 m in the shipped file). <code>max_z_position_lead_m</code> limits the vertical lead the same way.</figcaption>
</figure>

The planar modes require the $z$ components to be NaN, and the supervisor holds the altitude the drone had when it entered `MISSION`. The 3D modes require finite $z$ components. The position lead limit bounds how far ahead of the drone a `TRAJECTORY` setpoint may be; since PX4's position gains are close to 1, it also bounds the speed PX4 adds to correct a tracking error.

## Configuration

The launch file takes no arguments: everything comes from `config/mullet_core_params.yaml`. One drone runs one supervisor with its own copy of that file. The parameters an operator changes in the field are listed in [Field parameters](../on-field/fsm.md#field-parameters).

## Build and run

On the drone, the image builds on mullet-base and compiles the sibling mullet-interfaces checkout. The compose project starts two containers: the supervisor, and the Micro XRCE-DDS Agent on the PX4 serial port (`/dev/ttyTHS1`, 921600 baud by default). PX4's `UXRCE_DDS_DOM_ID` must equal `ROS_DOMAIN_ID`.

```bash
cd docker
cp .env.example .env    # ROS_DOMAIN_ID and the PX4 serial port
docker compose up -d --build
```

The Orin must have `NetworkManager-wait-online` enabled. A container that starts before the Wi-Fi address exists loses its topics whenever the Wi-Fi drops.

For development, build it in a colcon workspace next to mullet-interfaces. The host has no ROS 2, so build and test inside the `ghcr.io/skymule-ai/px4-sitl` image with mullet-sim's `ws/install` sourced:

```bash
colcon build --packages-select mullet_core --symlink-install
colcon test --packages-select mullet_core
colcon test-result --verbose
source install/setup.bash
ros2 launch mullet_core mullet_core.launch.py
```

## Source of truth

The repository's `docs/` folder documents the behaviour in full: `state-machine.md`, `actions.md`, `configuration.md`, `px4-interface.md` and `testing.md`.
