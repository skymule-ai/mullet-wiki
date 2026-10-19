# mullet-lio

mullet-lio builds LiDAR-inertial odometry images, which estimate the drone's pose from the MID-360's point cloud and IMU. The first one is FAST-LIO2, `ghcr.io/skymule-ai/mullet-lio-fast-lio`. [mullet-localization](localization.md) runs it as the `fast-lio` profile, alone or next to OpenVINS.

Repository: [skymule-ai/mullet-lio](https://github.com/skymule-ai/mullet-lio)

## Interfaces

| Direction | Name | Type | Rate |
| --- | --- | --- | --- |
| subscribes | `/livox/lidar` | `livox_ros_driver2/msg/CustomMsg` | 10 Hz |
| subscribes | `/livox/imu` | `sensor_msgs/Imu` (acceleration in g) | 200 Hz |
| publishes | `/uav0/fast_lio/odometry` | `nav_msgs/Odometry`: MID-360 IMU pose, body-frame twist, covariance | 10 Hz |
| publishes | `/uav0/fast_lio/cloud_registered_body` | `sensor_msgs/PointCloud2`, deskewed scan in the IMU frame | 10 Hz |

FAST-LIO2 needs `CustomMsg` because only it carries each point's time, which is what lets FAST-LIO2 undo the motion during a scan. The message package is copied from the [mullet-drivers](drivers.md) Livox image, so its type matches the driver's exactly.

## Configuration

`config/fast-lio/mid360.yaml` is upstream's MID-360 file with three changes: the factory LiDAR-IMU extrinsic is held fixed, and map publishing and PCD saving are off (both grow without bound in flight). A patch makes the odometry standard (covariance in ROS order, twist in the body frame), which the bridge needs. The drone's own copy lives in mullet-localization. The repository's `docs/fast-lio.md` explains the estimator and its failure modes.

## Build and run

```bash
cp .env.example .env
docker compose --profile fast-lio build fast-lio
./scripts/smoke-fast-lio.sh      # includes a synthetic MID-360 run that checks the odometry
docker compose --profile fast-lio up
```

Keep the drone still while FAST-LIO2 starts: it initialises gravity and the IMU biases from the first samples.

## Source of truth

The repository's `README.md` and `docs/fast-lio.md`.
