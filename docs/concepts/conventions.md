# Conventions

This page fixes the frames, units, names and numbers the rest of the wiki relies on. Other pages link here instead of restating them.

## Coordinate frames

| Frame | Axes | Origin | Used by |
| --- | --- | --- | --- |
| WGS84 | latitude, longitude (degrees), altitude (m above mean sea level) | the Earth | mission specs, `DroneHeartbeat` `lat`/`lon`/`alt`, Paddock maps |
| PX4 local NED | $x$ north, $y$ east, $z$ down (m) | the EKF origin | every PX4 topic, `MissionCommand`, `DroneHeartbeat` `x`/`y`/`z` |
| Body FRD | $x$ forward, $y$ right, $z$ down | the vehicle | PX4 attitude and external vision |
| ROS ENU | $x$ east, $y$ north, $z$ up | per node | ROS sensor and odometry topics (REP 103) |

<figure class="diagram">
--8<-- "docs/assets/figures/frames.svg"
<figcaption>The same heading in both frames. NED measures yaw clockwise from north; ENU measures it counter-clockwise from east. Seen from the side, a height above the EKF origin is a negative z in NED.</figcaption>
</figure>

**EKF origin.** PX4's estimator, EKF2, picks a WGS84 reference point (`VehicleLocalPosition.ref_lat`, `ref_lon`, `ref_alt`), usually where the drone was when it got its first position fix. The local NED frame is centred there. Every drone has its own origin, so compare two drones through their WGS84 positions, never through their local $x$ and $y$.

**From WGS84 to local NED.** A mission spec is written in WGS84. When the drone loads it, the framework projects each point around the EKF origin with PX4's own azimuthal-equidistant projection. If PX4 moves its origin after the load, the projected mission no longer matches the ground, and the framework refuses or aborts it.

**Heights.** Spec heights (`max_altitude_m`, obstacle `height_m`, density altitudes) are in metres above the EKF origin, measured upwards. A height $h$ is therefore $z = -h$ in local NED.

**Heading.** Yaw $\psi$ is in radians, measured clockwise from north, in local NED. Specs give bearings in degrees, also clockwise from north.

**NED and ENU.** A position, and the heading, convert between the two frames as follows:

$$
\begin{bmatrix} x \\ y \\ z \end{bmatrix}_{\text{ENU}}
=
\begin{bmatrix} 0 & 1 & 0 \\ 1 & 0 & 0 \\ 0 & 0 & -1 \end{bmatrix}
\begin{bmatrix} x \\ y \\ z \end{bmatrix}_{\text{NED}},
\qquad
\psi_{\text{ENU}} = \frac{\pi}{2} - \psi_{\text{NED}}
$$

The matrix is its own inverse, so the same formula converts in the other direction.

## Units

The stack uses SI units throughout. Each field or parameter name ends in a suffix that gives its unit.

| Suffix | Unit |
| --- | --- |
| `_m` | metre |
| `_mps` | metre per second |
| `_mps2` | metre per second squared |
| `_s`, `_ms` | second, millisecond |
| `_hz` | hertz |
| `_rad`, `_deg` | radian, degree |

## Vehicle instances and names

One number, the vehicle instance $N$, sets every name a drone uses. It is `vehicle_instance` in `mullet_core`'s parameter file. The real aircraft run $N = 0$. A simulated fleet starts at $N = 1$.

| Name | $N = 0$ (aircraft) | $N \ge 1$ (simulated fleet) |
| --- | --- | --- |
| `drone_id` | `uav_0` | `uav_N` |
| Supervisor actions and services | `/takeoff`, `/land`, `/return_home`, `/start_mission`, `/hold` | `/uav_N/takeoff`, … |
| Mission command topic | `/command` | `/uav_N/command` |
| PX4 topics | `/fmu/in/…`, `/fmu/out/…` | `/uav_N/fmu/in/…`, `/uav_N/fmu/out/…` |
| MAVLink system id (`target_system`) | 1 | $N + 1$ |

The prefix `uav` is `px4_namespace_prefix`. `drone_id` defaults to `uav_<N>` when it is left empty. The heartbeat publishes every one of these names, so clients read them from it instead of building them.

**Versioned PX4 topics.** When a PX4 message has a version above 0, its topic name gets a `_v<version>` suffix. In PX4 1.17, for example, the local position topic is `vehicle_local_position_v1`.

## ROS 2 domain

Every process that should see a drone must use the same `ROS_DOMAIN_ID`.

| Setup | Domain |
| --- | --- |
| Aircraft | 99 |
| Simulator on a laptop | 42 |

On the aircraft, set the same value in five places: `mullet-core/docker/.env`, the framework's `.env`, `mullet-localization/.env`, Paddock's `.env.ros2`, and PX4's `UXRCE_DDS_DOM_ID` parameter.

All containers use Fast DDS (`RMW_IMPLEMENTATION=rmw_fastrtps_cpp`) with `FASTDDS_BUILTIN_TRANSPORTS=UDPv4`. Fast DDS's default shared-memory transport lets processes discover each other across host-networked containers but then delivers no samples, and it does not cross Wi-Fi at all.

## Versions and image tags

| Component | Version | Pinned in |
| --- | --- | --- |
| PX4 firmware | v1.17.0, Pixhawk 6C | mullet-px4 |
| ROS 2 | Jazzy | mullet-base |
| `px4_msgs` | branch `release/1.17` | mullet-base, mullet-sim |
| Base image | `ghcr.io/skymule-ai/mullet-base:v0.5.1` | each image's `BASE_IMAGE` |
| SITL image | `ghcr.io/skymule-ai/px4-sitl:v1.17.0` | mullet-sim |

The aircraft run only immutable tags: a release (`v0.5.1`) or a commit (`sha-<commit>`). The `:main` tag moves with every merge and is only for integration testing.
