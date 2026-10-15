# mullet-sim

Multi-vehicle PX4 SITL + Gazebo + ROS 2. One Docker container, N vehicles, host tmux (`tmux -L mullet`) or headless.

Repo: [skymule-ai/mullet-sim](https://github.com/skymule-ai/mullet-sim)

Image: `ghcr.io/skymule-ai/px4-sitl:v1.17.0`, built from `image/` in this repo ([PX4 image](#px4-image)). Submodules: `mullet-core`, `mullet-interfaces`. Host networking; QGroundControl on localhost.

`--headless` is paddock's live backend and the SITL target for mission-framework e2e tests.

## Bring-up

```bash
./setup.sh
./run.sh --config config/sessions/example_uav.yaml
./stop.sh
```

```bash
./run.sh --headless --config config/paddock.yaml --domain 42
```

`--headless` skips tmux/Gazebo GUI, starts `mullet_core` per drone, returns when every `/mullet/heartbeat` is up (`uav_1`, `uav_2` in `config/paddock.yaml`). `--keep` leaves a GUI session running after detach.

```bash
tui/build.sh
./mullet
```

```bash
python3 scripts/spawn_fleet.py --config config/sessions/example_uav.yaml --print-env
```

## Names

| Instance | Prefix |
| --- | --- |
| `0` | `/fmu/...` |
| `N` + `namespace_prefix: uav` | `/uav_N/...` |

Start fleets at instance `1`. One ROS domain for the whole run: `run.sh --domain N` wins over config / env.

`MAV_SYS_ID = UXRCE_DDS_KEY = instance + 1`. Port clash: `./stop.sh` then retry.

## PX4 image

`image/` builds `ghcr.io/skymule-ai/px4-sitl`: Ubuntu 24.04, ROS 2 Jazzy, Gazebo Harmonic, PX4 **v1.17.0**. No app logic. It replaces the former `sitl_builder` repo. Keep it on the same 1.17 line as `px4_msgs` in every ROS image. Pixhawks run 1.17.x; do not ship `-rc` / `-beta` here.

```bash
docker build -t ghcr.io/skymule-ai/px4-sitl:v1.17.0 image/
```

Release: push a `px4-v*` tag. The workflow publishes `:px4-v1.17.0` and `:v1.17.0`.

```bash
git tag -a px4-v1.17.0 -m "Release PX4 v1.17.0 (ROS 2 Jazzy)"
git push origin px4-v1.17.0
```

Extra apt/pip without touching the Dockerfile: `image/additional-packages.list`, `image/additional-requirements.txt`.
