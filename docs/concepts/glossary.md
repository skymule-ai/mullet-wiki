# Glossary

Terms used across the wiki, in alphabetical order.

| Term | Meaning |
| --- | --- |
| Action (ROS 2) | A long-running request with feedback and a final result, which the caller can cancel. The supervisor serves **Takeoff**, **Land** and **Return home** as actions. |
| Capability flag | A `can_*` field of the heartbeat (`can_takeoff`, `can_start_mission`, …). It is true when the supervisor would accept that command right now. |
| DDS, ROS 2 domain | DDS is the middleware that carries ROS 2 messages. Processes see each other only if they use the same domain number, `ROS_DOMAIN_ID`. See [Conventions](conventions.md#ros-2-domain). |
| EKF2 | PX4's state estimator, an extended Kalman filter. It fuses the IMU, GPS, barometer, magnetometer and, when enabled, external vision. |
| EKF origin | The WGS84 point at the centre of PX4's local NED frame. See [Conventions](conventions.md#coordinate-frames). |
| Ergodic coverage | Flying so that, over time, the fraction of time spent in each region matches a target density. See [Ergodic MPPI](../frameworks/ergodic-mppi.md). |
| External vision (EV) | A pose or velocity estimate from a camera or LiDAR pipeline, sent to EKF2 on `/fmu/in/vehicle_visual_odometry`. |
| Framework (mission framework) | A node that plans a mission and streams `MissionCommand` to the supervisor while it is in `MISSION`. See [Frameworks](../frameworks/index.md). |
| GMM | Gaussian mixture model: a weighted sum of Gaussian densities. Mission specs describe the area of interest as one. |
| Heartbeat | `DroneHeartbeat`, the full status snapshot every supervisor publishes on `/mullet/heartbeat` at 10 Hz. |
| HIL | Hardware in the loop: the real Orin and Pixhawk run, while the sensors and physics are simulated (here with SIH). |
| LIO, VIO | LiDAR-inertial and visual-inertial odometry: pose estimation from a LiDAR or camera combined with an IMU. |
| MAVLink system id | The number that identifies a vehicle on MAVLink, `target_system` in PX4 commands. It is the vehicle instance plus one. |
| Micro XRCE-DDS Agent | The bridge between PX4's uXRCE-DDS client on the Pixhawk and the ROS 2 network on the Orin. It runs on the Orin, connected by serial. |
| MPPI | Model predictive path integral control: a sampling-based model predictive controller. It simulates many perturbed control sequences, scores each one, and averages them weighted by cost. |
| Offboard | The PX4 flight mode in which an external computer sends the setpoints. The supervisor uses it for every automated flight. |
| Preflight | The checks a framework runs after loading a mission and before reporting `READY`. |
| SIH | Simulation in hardware: PX4 simulates the physics and sensors on the Pixhawk itself, so the real firmware and estimator run without the motors spinning. |
| SITL | Software in the loop: PX4 runs as a process on a computer, with Gazebo simulating the world. See [mullet-sim](../stack/sitl.md). |
| Spec (mission spec) | A JSON document that describes a mission for one framework. Its `schema` key, for example `ergodic/3`, names the format. |
| Supervisor | `mullet_core`, the node that owns the drone's state machine and is the only node that sends setpoints to PX4. |
| Vehicle instance | The number $N$ that sets a drone's names. See [Conventions](conventions.md#vehicle-instances-and-names). |
