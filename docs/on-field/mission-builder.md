# Mission Builder

The Mission Builder is Paddock's map editor for mission specs. Open it from the top bar, or at `#/mission-builder`. It has one builder today, for the ergodic framework (spec `ergodic/3`, one drone). The format itself is described on [Ergodic MPPI](../frameworks/ergodic-mppi.md#mission-spec).

The builder warns you about problems it can see, but the drone validates the spec and has the final word.

## Before you start

- Press **Download this area for offline use** in the toolbar. Paddock caches the basemap and terrain tiles up to zoom 15, at most 5000 tiles. The Esri satellite layer is never cached: its terms forbid it.
- Draft the mission at your desk with the **Offline (no drone)** target, then download the spec. In the field, open the file and deploy it.

## Steps

1. **Choose a target.** Pick a drone found from its heartbeat, or **Offline (no drone)**, then pick the framework. A greyed-out framework is one the drone does not advertise, or advertises with another spec version: update the drone.
2. **Draw the environment.** Drag a rectangle, or click polygon points and press Enter to close the polygon. This outline is the geofence: the drone treats everything outside it as an obstacle.
3. **Add obstacles.** Draw rectangles, circles or polygons and give each one a height. **Map buildings as obstacles** is on by default and adds every mapped building inside the environment. It reads buildings from the tiles on screen, so keep the whole environment in view at street zoom.
4. **Place the density.** Click to place Gaussians, or generate a random mixture. Drag the handles to set each Gaussian's spread (sigma) and bearing. The density says where the drone should spend its time.
5. **Set the mission.** Enter the mission id, command mode, duration, ceiling and vehicle limits, then press **Deploy**.
6. **Watch the preflight** in the panel. **Start mission** unlocks only when the framework reports `READY` (see [Running a framework](frameworks.md#status)).

## Choosing a command mode

| Mode | Use it when |
| --- | --- |
| `trajectory` | By default. The flight is planar, and PX4 tracks the planned position, so it corrects the drone's tracking error. |
| `trajectory_3d` | The drone must fly over obstacles lower than the ceiling. These obstacles are drawn amber in the 3D view. |
| `velocity`, `acceleration` and their `_3d` versions | Only for comparison runs. With PX4's real response lag they drift into the safety margins. |

Keep `max_speed_mps` at or below the supervisor's `max_vx_ned_mps` and `max_vy_ned_mps`, and `max_vertical_speed_mps` at or below `max_vz_ned_mps` (see [Field parameters](fsm.md#field-parameters)).

## Previous missions

Under the framework, **Previous missions** lists every spec the drone has accepted, newest first. The drone stores them and never deletes them. For each one you can inspect the spec, edit a copy, or load it again.

## Controls

| Action | 2D view | 3D view |
| --- | --- | --- |
| Undo, redo | Ctrl+Z, Ctrl+Shift+Z | same |
| Move, resize or rotate the environment | drag the centre or a corner; the orange knob rotates | — |
| Add or remove a vertex | drag an edge midpoint; double-click a vertex | — |
| Delete an obstacle | double-click its centre | — |
| Set an obstacle's height | the numeric field | drag the knob on top of the extrusion |
| Move a density blob | drag it | select its dot, then drag the N, E or Up arrow |
| Rotate a density blob | the bearing handle | the red, green or blue ring |
| Stretch a sigma | the handles | the white tips on the blob's axes |
| Orbit the camera | — | Ctrl + middle-drag, right-drag, or the compass |
| Deselect | — | click empty map, or press Esc |

Place blobs in 2D first, then lift them to their altitude in 3D.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Error "needs N M grid cells". | The area is too large for the planning grid: about 200 m × 200 m for planar missions, and 100 m × 100 m × 30 m in 3D. | Shrink the environment. |
| Error "ceiling must exceed …". | In 3D both the ground and the ceiling are grown by the safety margin, so the ceiling must be more than twice that margin above the ground. | Raise `max_altitude_m`. |
| Warning that an obstacle is treated as full height. | The drone cannot fly over it under this ceiling. | Raise the ceiling, or accept it. |
| The drone refuses the load. | Its own validation found a problem, for example a density peak inside an obstacle. | Read `reason` in the panel. |
| Buildings are missing. | Their tiles are not loaded. | Zoom to street level over the whole environment. |
