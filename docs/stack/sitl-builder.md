# sitl_builder

Builds the PX4 SITL Docker image: Ubuntu 24.04, ROS 2 Jazzy, Gazebo Harmonic, PX4 **v1.17.0**. No app logic.

Repo: [skymule-ai/sitl_builder](https://github.com/skymule-ai/sitl_builder)

`ghcr.io/skymule-ai/px4-sitl:v1.17.0` is what [mullet_sitl_sim](sitl.md) runs. Keep this on the same 1.17 line as `px4_msgs` in every ROS image. Pixhawks run 1.17.x; do not ship `-rc` / `-beta` here.

## Build / pull

```bash
docker compose build
docker compose up -d
docker pull ghcr.io/skymule-ai/px4-sitl:v1.17.0
```

## Release

Push a `px4-v*` tag. Workflow publishes `:px4-v1.17.0` and `:v1.17.0`.

```bash
git tag -a px4-v1.17.0 -m "Release PX4 v1.17.0 (ROS 2 Jazzy)"
git push origin px4-v1.17.0
```

Extra apt/pip without touching the Dockerfile: `docker/additional-packages.list`, `docker/additional-requirements.txt`.
