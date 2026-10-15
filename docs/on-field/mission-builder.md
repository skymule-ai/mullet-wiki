# Mission Builder

Paddock's map editor for mission specs. Open it from the top bar or at `#/mission-builder`. Today it has one builder: **ergodic** (`ergodic/3`, one drone).

The builder only warns you. The drone validates the spec and has the final word.

## Before you go

- **Download this area for offline use** (toolbar). This caches the basemap and terrain up to zoom 15, at most 5000 tiles. Esri satellite imagery is never cached.
- Draft the mission at your desk with **Offline (no drone)**, then **download** the spec. On the field, **open** it and deploy.

## Do

1. **Pick a target.** Choose a drone found by its heartbeat, or *Offline*. Then pick the framework.
    A greyed-out framework means the drone does not advertise it, or runs another schema: update the drone.
2. **Environment.** Drag a rectangle, or click polygon points (Enter closes the polygon). This outline is the geofence.
3. **Obstacles.** Draw rectangles, circles or polygons and give each a height.
    *Map buildings as obstacles* is on by default. Keep the environment on screen at street zoom so the buildings load.
4. **Density.** Click to place Gaussians, or generate a random mixture. Drag the handles to set sigma and bearing.
5. **Mission.** Set the id, command mode, duration, ceiling and vehicle limits. Then press **Deploy**.
6. **Watch the preflight** in the panel. **Start mission** unlocks only when the framework reports `READY` ([Frameworks](frameworks.md)).

## Which command mode

| Mode | When |
| --- | --- |
| `trajectory` | **Default.** Planar. PX4 tracks the planned position, so tracking error gets corrected. |
| `trajectory_3d` | You need to fly **over** obstacles lower than the ceiling (amber in the 3D view). |
| `velocity`, `acceleration` (+ `_3d`) | Comparison runs only. They drift into the margins on real PX4 lag. |

Keep `max_speed_mps` ≤ core's `max_vx/vy_ned_mps`, and `max_vertical_speed_mps` ≤ `max_vz_ned_mps`.

## Previous missions

Under the framework, **Previous missions** lists every spec the drone ever accepted, newest first. From there you can:

- **Inspect** a spec.
- **Edit a copy** of it.
- **Load** it again.

The drone stores these specs; nothing is ever pruned.

## Controls

| Action | 2D | 3D view |
| --- | --- | --- |
| Undo / redo | Ctrl+Z / Ctrl+Shift+Z | same |
| Move / resize the area | drag the centre / corners, orange knob rotates | — |
| Add / remove a vertex | drag an edge midpoint / double-click the vertex | — |
| Delete an obstacle | double-click its centre | — |
| Obstacle height | numeric field | drag the knob on top of the extrusion |
| Move a density blob | drag it | select its dot, drag the N / E / Up arrows |
| Rotate a density blob | bearing handle | red / green / blue rings |
| Stretch a sigma | handles | white tips on the blob's axes |
| Orbit the camera | — | Ctrl + middle-drag, right-drag, or the compass |
| Deselect | — | click empty map or Esc |

Place blobs in 2D first, then lift them in 3D.

## If → then

| If | Then |
| --- | --- |
| Error: "needs N M grid cells" | The area is too big. Planar grids top out around 200 × 200 m; 3D around 100 × 100 × 30 m. |
| Error: "ceiling must exceed …" | In 3D, raise `max_altitude_m` so there is room above both safety margins. |
| Warning: obstacle treated as full height | Nothing can fly over it under this ceiling. Raise the ceiling or accept it. |
| Load refused | Read `reason`: the drone's validation found a problem (for example, a density mode not in free space). |
| Buildings are missing | Zoom in to street level over the whole environment. |
