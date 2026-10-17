# Stack

MULLET is a set of small repositories, each with one job. Every component ships as a versioned container image, so a drone runs a pinned, reproducible set of images. This section has one reference page per repository. How the pieces fit together is on [Architecture](../concepts/architecture.md). Frames, names, domains and versions are on [Conventions](../concepts/conventions.md).

## Flight control

| Repository | What it does |
| --- | --- |
| [mullet-interfaces](interfaces.md) | The ROS 2 messages, services and actions every other repository builds against |
| [mullet-core](core.md) | The supervisor: the drone's state machine, and the only node that sends setpoints to PX4 |
| [mullet-px4](px4.md) | PX4 firmware pin, each drone's parameter baseline, and the localization profiles |

## Operator

| Repository | What it does |
| --- | --- |
| [mullet-paddock](paddock.md) | The ground station: web UI and ROS 2 gateway |

## Localization

| Repository | What it does |
| --- | --- |
| [mullet-localization](localization.md) | One drone's localization deployment: pins the images below, holds the sensor calibration, and bridges the estimate into EKF2 |
| [mullet-drivers](drivers.md) | Driver images for the Intel RealSense D435i and the Livox MID-360, plus an optional visualization image |
| [mullet-vio](vio.md) | Visual-inertial odometry images; OpenVINS today |
| [mullet-lio](lio.md) | LiDAR-inertial odometry images; a scaffold, no implementation yet |

## Platform and simulation

| Repository | What it does |
| --- | --- |
| [mullet-base](ros-base.md) | The ROS 2 Jazzy base image for the Orin that every drone image builds on |
| [mullet-sim](sitl.md) | A multi-drone PX4 software-in-the-loop simulator, and the PX4 SITL image |

Mission frameworks live in their own repositories and are listed under [Frameworks](../frameworks/index.md).
