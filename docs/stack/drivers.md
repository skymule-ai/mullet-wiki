# mullet-drivers

mullet-drivers builds the sensor driver images: one for the Intel RealSense D435i camera, one for the Livox MID-360 LiDAR, and an optional visualization image with RViz and `foxglove_bridge`. It holds no drone-specific configuration. Each drone's serial numbers, addresses and calibration live in [mullet-localization](localization.md), which runs these images.

Repository: [skymule-ai/mullet-drivers](https://github.com/skymule-ai/mullet-drivers)

## Images

| Image | Contents | Publishes |
| --- | --- | --- |
| `ghcr.io/skymule-ai/mullet-drivers-realsense` | librealsense and `realsense-ros` | colour, depth, infrared, accelerometer and gyroscope, aligned depth and a textured `PointCloud2`, under `/uav0/d435i/…` |
| `ghcr.io/skymule-ai/mullet-drivers-livox` | Livox SDK2, `livox_ros_driver2` and `ptp4l` | `CustomMsg` and IMU on `/livox/lidar` and `/livox/imu`; the `livox-ptp` service syncs the LiDAR's clock |
| `ghcr.io/skymule-ai/mullet-drivers-viz` | RViz and `foxglove_bridge` | a Foxglove WebSocket on port 8765 |

Neither vendor driver computes its point cloud on the GPU, but CUDA is available to the nodes that consume them. The RealSense namespace and TF prefix are set by `REALSENSE_CAMERA_NAMESPACE`, `REALSENSE_CAMERA_NAME` and `REALSENSE_TF_PREFIX`, so several drones do not collide.

The containers get only the hardware they need. The LiDAR uses host networking, and the camera gets USB access only. Do not add `privileged: true` or mount all of `/dev`.

## Build and run

```bash
cp .env.example .env
docker compose --profile livox build
./scripts/smoke-livox.sh
docker compose --profile realsense build
./scripts/smoke-realsense.sh
```

Connect each sensor before its smoke test. `docker compose exec <service> bash -l` opens a shell with ROS 2 and the driver already sourced.

To look at the data from the ground station, run the `foxglove` profile and connect Lichtblick or Foxglove to `ws://<drone-ip>:8765`. The bridge streams only the topics a panel subscribes to; a raw MID-360 cloud alone is about 5 MB/s over Wi-Fi. `/livox/lidar` is a Livox `CustomMsg`, which Foxglove cannot draw: view FAST-LIO's `/uav0/fast_lio/cloud_registered_body`. The `viz` profile runs RViz on a display attached to the Orin; leave it off in flight.

## Versions

Every image builds on `mullet-base:v0.5.1` and pins its upstream source revision. Update a pin only after testing it on the Orin. Branch pushes publish `sha-<commit>` images, and release tags publish matching image tags. Tags up to `v0.3.0` are the ROS 2 Humble images, published as `mullet-ros-livox` and `mullet-ros-realsense`.

## Source of truth

The repository's `README.md`.
