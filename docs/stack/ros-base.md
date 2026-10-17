# mullet-base

mullet-base is the container image every drone image builds on. It provides ROS 2 Jazzy for the Orin's ARM64 processor, with CUDA, the PX4 message definitions and the Micro XRCE-DDS Agent already installed.

Repository: [skymule-ai/mullet-base](https://github.com/skymule-ai/mullet-base)

## What it provides

| Component | Version |
| --- | --- |
| Target hardware | NVIDIA Jetson Orin Nano, JetPack 6.2.2 (L4T R36.5.0) on the host |
| Image operating system | Ubuntu 24.04 |
| ROS 2 | Jazzy |
| CUDA | 13.2, with `cuda-compat-orin-13-2` |
| PX4 messages | `px4_msgs` branch `release/1.17` |
| Micro XRCE-DDS Agent | v2.4.2 |

Ubuntu 24.04 has no CUDA 12.6 build for this board. The image therefore ships CUDA 13.2 with NVIDIA's `cuda-compat-orin` user-space driver, which runs CUDA 13 on the JetPack 6 kernel driver without reflashing. The host needs the NVIDIA Container Toolkit.

The image is published as `ghcr.io/skymule-ai/mullet-base`. Tags from `v0.5.0` are Jazzy. Older tags were published as `mullet-ros2-base`, and those up to `v0.4.0` are ROS 2 Humble. Drone images pin an immutable tag:

```dockerfile
FROM ghcr.io/skymule-ai/mullet-base:v0.5.1
```

mullet-core, the framework images, and the mullet-localization, mullet-drivers, mullet-vio and mullet-lio images all build on it.

## Set up the Orin

The Orin's UART to the Pixhawk must be enabled once, on the host. After the reboot it is `/dev/ttyTHS1`.

```bash
git clone https://github.com/jetsonhacks/jetson-orin-uart.git
cd jetson-orin-uart && sudo bash install.sh
sudo reboot
```

## Build and run

On a development machine:

```bash
docker compose build
docker compose run --rm ros2-base
```

On the Orin, pick a published tag instead of building. The compose file passes the host UART through as `/dev/ttyTHS1`; set `MULLET_UART_DEVICE` if the host names it differently.

```bash
MULLET_ROS_IMAGE_TAG=v0.5.1 docker compose run --rm ros2-base
```

Every push publishes an image tagged `sha-<short commit>`. To smoke-test one on the Orin before tagging a release:

```bash
cp .env.example .env
./scripts/test-on-orin.sh sha-<short commit>
```

## Source of truth

The repository's `README.md`.
