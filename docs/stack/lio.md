# mullet-lio

mullet-lio will build LiDAR-inertial odometry images, which estimate the drone's pose from the MID-360's point cloud and IMU. Today it is a scaffold: a development image based on mullet-base, a Compose file that runs it next to the LiDAR driver, and an empty workspace. No LIO implementation has been chosen or installed yet. FAST-LIO2 is the first candidate.

Repository: [skymule-ai/mullet-lio](https://github.com/skymule-ai/mullet-lio)

## Interfaces

| Direction | Name | Type |
| --- | --- | --- |
| subscribes | `/livox/lidar` | `sensor_msgs/PointCloud2` |
| subscribes | `/livox/imu` | `sensor_msgs/Imu` |
| publishes | odometry, to be decided | `nav_msgs/Odometry`, so mullet-localization's bridge can forward it |

The image builds on mullet-base, not on the LiDAR image. That works as long as the chosen package reads standard ROS messages. If it needs `livox_ros_driver2/msg/CustomMsg`, its build also needs that message package.

## Developing an implementation

1. Clone the candidate package into `ws/src/` on the host. The workspace is mounted into the container.
2. Start the LiDAR driver and the development container: `cp .env.example .env`, then `docker compose build lio` and `docker compose up -d`.
3. Inside the container (`docker compose exec lio bash -l`), check the input with `ros2 topic hz /livox/lidar`, then build with `rosdep install` and `colcon build`.
4. Once it produces odometry, move the dependencies, the pinned source revision, the build and the launch command into `images/lio/Dockerfile`.

Building a LIO package and comparing it against OpenVINS on recorded flights is a good student project.

## Source of truth

The repository's `README.md`.
