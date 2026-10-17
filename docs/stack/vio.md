# mullet-vio

mullet-vio builds visual-inertial odometry images. It has one today, OpenVINS, which estimates the drone's pose from the D435i's infrared stereo images and IMU. Each implementation gets its own image, configuration folder and Compose service, so estimators never share a dependency set.

Repository: [skymule-ai/mullet-vio](https://github.com/skymule-ai/mullet-vio)

## Interfaces

The VIO image does not include the camera driver. The two run as separate containers and meet through ROS 2 topics.

| Direction | Name | Type |
| --- | --- | --- |
| subscribes | `/uav0/d435i/…` infrared images and IMU | `sensor_msgs/Image`, `sensor_msgs/Imu` |
| publishes | `/uav0/openvins/odomimu` | `nav_msgs/Odometry` |

On a drone, [mullet-localization](localization.md) runs this image and forwards its odometry to PX4. Keep the D435i's infrared projector off whenever VIO uses the infrared images (see the warning on that page).

## Configuration

OpenVINS reads `/config/estimator_config.yaml`, which points to the camera and IMU calibration files in the same folder. This repository's `config/` holds examples; the files a drone flies with are in mullet-localization.

The upstream source and revision are build arguments. `OPENVINS_REF` should be a full commit SHA, so the image is reproducible.

## Build and run

```bash
cp .env.example .env
./scripts/validate.sh
docker compose --profile openvins build openvins
./scripts/smoke-openvins.sh
```

The smoke test checks that the package, launch file and configuration are in place, and that OpenVINS stays up while it waits for sensor data. It does not check calibration or accuracy. Do not tag a release until a test on the Orin shows it consuming the images and IMU and publishing odometry.

Images are published as `ghcr.io/skymule-ai/mullet-vio-openvins`, built for ARM64 on `mullet-base:v0.5.1`. A different OpenVINS revision can be built from GitHub Actions without changing the repository: *Build and Push VIO Images*, *Run workflow*.

## Source of truth

The repository's `README.md`.
