# mullet-sim

mullet-sim runs a fleet of simulated PX4 drones on a Linux computer. One Docker container runs Gazebo, one PX4 software-in-the-loop (SITL) process per drone, and a single Micro XRCE-DDS Agent. It is Paddock's development backend and the test target for frameworks. The repository also builds the PX4 SITL image.

Repository: [skymule-ai/mullet-sim](https://github.com/skymule-ai/mullet-sim)

## What it provides

| Item | Value |
| --- | --- |
| Image | `ghcr.io/skymule-ai/px4-sitl:v1.17.0`: Ubuntu 24.04, ROS 2 Jazzy, Gazebo Harmonic, PX4 v1.17.0 |
| Submodules | mullet-core and mullet-interfaces, cloned over SSH |
| Networking | host network; QGroundControl connects on localhost |
| Drones | one per entry in the YAML config, at vehicle instance $N \ge 1$ |

With the `core` window enabled in its config, every drone gets its own supervisor, so a simulated drone has the same topics, actions and services as an aircraft. Only the names differ, as described in [Conventions](../concepts/conventions.md#vehicle-instances-and-names). The PX4 MAVLink system id and uXRCE-DDS key of instance $N$ are both $N + 1$.

## Build and run

Set up once:

```bash
./setup.sh
```

Run a fleet with the Gazebo window and a tmux dashboard (tmux socket `mullet`), then stop it:

```bash
./run.sh --config config/sessions/example_uav.yaml
./stop.sh
```

Run it headless, as Paddock and the framework tests do:

```bash
./run.sh --headless --config config/paddock.yaml --domain 42
```

`--headless` starts no GUI and no tmux, starts one supervisor per drone, and returns once every drone publishes its heartbeat. `config/paddock.yaml` has two X500 drones, `uav_1` and `uav_2`. `--domain` sets the ROS 2 domain for the whole run and overrides the config. `--keep` leaves a GUI session running after you detach.

An optional terminal UI builds a fleet interactively:

```bash
tui/build.sh
./mullet
```

To check a fleet config without starting anything:

```bash
python3 scripts/spawn_fleet.py --config config/sessions/example_uav.yaml --print-env
```

If a port is already in use, run `./stop.sh` and try again.

## The PX4 SITL image

`image/` builds the image and contains no MULLET code. It replaces the former `sitl_builder` repository. Keep its PX4 version on the same 1.17 line as the `px4_msgs` in every ROS image, and never ship a release candidate.

```bash
docker build -t ghcr.io/skymule-ai/px4-sitl:v1.17.0 image/
```

To publish it, push a `px4-v*` tag. The workflow publishes `:px4-v1.17.0` and `:v1.17.0`.

```bash
git tag -a px4-v1.17.0 -m "Release PX4 v1.17.0 (ROS 2 Jazzy)"
git push origin px4-v1.17.0
```

To add apt or pip packages without editing the Dockerfile, list them in `image/additional-packages.list` and `image/additional-requirements.txt`.

## Source of truth

The repository's `README.md`, and the interactive diagram in `docs/sitl_architecture.html`.
