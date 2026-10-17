# mullet-px4

mullet-px4 is the single source of every drone's PX4 setup: the firmware release, each drone's parameter baseline, and the localization profiles. Parameters change on a drone only through this repository.

Repository: [skymule-ai/mullet-px4](https://github.com/skymule-ai/mullet-px4)

## Firmware

Every drone runs stock PX4 v1.17.0 on a Pixhawk 6C, flashed from the official release file. The file's SHA-256 is pinned in the README and in `scripts/check_params.py`; change both together. mullet1 runs a build of the same commit that adds the CRSF RC driver, so its baseline has two parameters the release build lacks.

Flash it from QGroundControl (*Vehicle Setup*, *Firmware*, *Advanced settings*, *Custom firmware file*). Then load the drone's baseline (*Parameters*, *Tools*, *Load from file*) and reboot.

## Layout

| Path | Content |
| --- | --- |
| `drones/<name>/baseline.params` | the drone's full parameter set in its known-good outdoor state |
| `profiles/<name>.params` | only the parameters a profile sets; every profile sets the same names |
| `profiles/profiles.yaml` | each profile's parameter file, bridge mode and note |
| `scripts/set-profile.py` | applies, shows and backs up profiles on the drone |
| `scripts/check_params.py` | the CI check of every file against the firmware's parameter metadata |

## Localization profiles

A profile sets EKF2's sources and, with them, the mode of mullet-localization's bridge. All of them also set `EKF2_RNG_A_VMAX` to 2.0 and `EKF2_MIN_RNG` to 0.21.

| Profile | `EKF2_EV_CTRL` | `EKF2_MAG_TYPE` | Bridge | Use |
| --- | --- | --- | --- | --- |
| `outdoor` (default) | 0 | 0 | shadow | GPS and compass; vision is recorded only |
| `outdoor-vio` | 5 | 0 | fused | vision position and velocity fused with GPS and compass |
| `indoor` | 13 | 5 | fused | vision position and heading, compass off; bench and walking tests only, since PX4 does not yet align its heading on vision |

The supervisor publishes which sources EKF2 actually uses on `/mullet/localization_status`, and Paddock shows it.

## On the drone

The repository is cloned once to `~/mullet-px4` on the Orin. The script talks to PX4 through mavlink-router (`tcp:127.0.0.1:5760`) and finds the drone's baseline from the hostname.

```bash
cd ~/mullet-px4 && git pull
scripts/set-profile.py --show          # the active profile, the bridge mode, and any drift
scripts/set-profile.py outdoor-vio     # switch profile
scripts/set-profile.py --backup        # save every parameter to backups/<drone>-<UTC>.params
```

Switching refuses while the drone is armed. It backs up every parameter, writes the profile's changed parameters, reads each one back, and sets `PUBLISH_TO_PX4` in mullet-localization. If `EKF2_MAG_TYPE` changed, it saves to flash and asks before rebooting the Pixhawk, because that parameter applies only after a reboot.

`--show` reports drift: any parameter that differs from the baseline plus the active profile, ignoring those PX4 changes by itself.

## Rules

- Before any parameter change, run `set-profile.py --backup`. Switching a profile does it for you.
- Use QGroundControl to change parameters only for recovery. Afterwards, run `--show` and bring the repository back in line.
- A wanted change to a baseline, such as a calibration or a tuning, is a pull request: dump with `--backup`, copy it over `drones/<name>/baseline.params`, and say why.

## Source of truth

The repository's `README.md`.
