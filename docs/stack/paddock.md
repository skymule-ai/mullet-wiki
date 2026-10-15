# mullet-paddock

Operator control center: React / Vite UI + FastAPI gateway with a ROS 2 adapter.

Repo: [skymule-ai/mullet-paddock](https://github.com/skymule-ai/mullet-paddock)

```text
Browser UI → FastAPI gateway → ROS 2 clients → mullet_interfaces → mullet_core → PX4
```

No mock mode. Dev flies sibling `mullet-sim` (real PX4 SITL + `mullet_core`). Only `ROS_DOMAIN_ID` differs from an aircraft.

The UI must never publish `/fmu/in/*`. Land is the only way down. E-stop is the RC kill switch, not this UI.

Gateway `:8000` · frontend `:5173`. Discovery is heartbeat-only (`/mullet/heartbeat`).

## Actions

`IDLE → TRANSITION → HOLD ⇄ MISSION`. Buttons: Takeoff, Start mission, Hold, Return home, Land.

Start mission is refused until a framework on that drone reports `READY` (or `PAUSED` to resume).

Mission builder (`#/mission-builder`) draws framework specs on MapLibre, in 2D or a 3D view (terrain, buildings, obstacle extrusions, density ellipsoids). Ergodic is `ergodic/3`, `trajectory` mode by default. **Previous missions** lists the drone's library (`GET /api/drones/{id}/missions/{framework}/stored`) to inspect, copy or reload. Operator steps: [On Field → Mission Builder](../on-field/mission-builder.md). **Download this area** prefetches vector + terrain tiles into `MULLET_TILE_CACHE` / `.tile-cache/` (`POST /api/tiles/prefetch`).

## SITL + UI

```bash
cp .env.ros2.example .env.ros2
mkdir -p gateway/vendor
git clone git@github.com:skymule-ai/mullet-interfaces.git gateway/vendor/mullet_interfaces
make install
make sim-dev
make frontend-dev
```

`make sim-dev` runs `../mullet-sim/run.sh --headless --config config/paddock.yaml --domain <ROS_DOMAIN_ID>` then the gateway. Default fleet: `uav_1`, `uav_2` on domain **42**.

```bash
make sim-down
git -C gateway/vendor/mullet_interfaces pull --ff-only
```

## Aircraft

Set `ROS_DOMAIN_ID` in `.env.ros2` to the aircraft (example **99**) and keep Fast DDS on UDPv4 (compose default).

```bash
make ros2-dev
make frontend-dev
```

```bash
curl -s localhost:8000/api/health
curl -s localhost:8000/api/drones
curl -sX POST localhost:8000/api/drones/uav_1/takeoff \
  -H 'content-type: application/json' -d '{"altitude_m": 3.0}'
```

Rejected commands are HTTP 200 with `accepted: false`.
