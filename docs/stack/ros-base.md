# mullet-base

ARM64 ROS 2 **Jazzy** base image for NVIDIA **Jetson Orin** (JetPack 6.2.2 / L4T R36.5): CUDA 13.2 + `cuda-compat-orin`, `px4_msgs` `release/1.17`, Micro XRCE-DDS Agent **v2.4.2**.

Repo: [skymule-ai/mullet-base](https://github.com/skymule-ai/mullet-base)

`ghcr.io/skymule-ai/mullet-ros2-base`. Tags `v0.4.0` and older are Humble. `v0.5.0+` is Jazzy. Aircraft images pin an immutable tag, never `:main`.

Consumed by `mullet-core/docker` and the ergodic mission image.

## Dev

```bash
docker compose build
docker compose run --rm ros2-base
```

## Orin

UART once ([jetson-orin-uart](https://github.com/jetsonhacks/jetson-orin-uart)), then reboot. Host device `/dev/ttyTHS1`.

```bash
git clone https://github.com/jetsonhacks/jetson-orin-uart.git
cd jetson-orin-uart && sudo bash install.sh
sudo reboot
```

```bash
MULLET_ROS_IMAGE_TAG=v0.5.0 docker compose \
  -f docker-compose.yml -f docker-compose.jetson.yml \
  run --rm ros2-base
```

```bash
./scripts/test-on-orin.sh sha-<short-commit-sha>
```

Downstream:

```dockerfile
FROM ghcr.io/skymule-ai/mullet-ros2-base:v0.5.0
```
