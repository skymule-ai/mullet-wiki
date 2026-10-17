# Onboard mapping

## Goal

The drone builds a 3D occupancy map of its surroundings while it flies, from its own sensors, on the Orin. The map has two parts: a local map around the drone, updated fast enough for a planner to avoid obstacles, and a global map of everything seen during the flight.

The map has to live on the drone. A planner replans many times per second and cannot wait for a radio link, and a voxel map is also much smaller to send to the ground than the point clouds it is built from.

## Fits into the stack as

A new repository, `mullet-mapping`, built like [mullet-lio](../stack/lio.md): an image on mullet-base, run as its own container next to the sensor drivers, and added to a drone's [mullet-localization](../stack/localization.md) Compose project as a profile.

## Inputs and outputs

| Direction | Data | Type |
| --- | --- | --- |
| reads | MID-360 point cloud, `/livox/lidar` | `sensor_msgs/PointCloud2` |
| reads | D435i depth or point cloud, `/uav0/d435i/…` | `sensor_msgs/Image`, `PointCloud2` |
| reads | the drone's pose, from VIO or LIO | `nav_msgs/Odometry` |
| writes | local occupancy, around the drone | a voxel grid or distance field, format to decide |
| writes | global map | a voxel map that can be saved and diffed |

## Contract changes

Probably none to start with: the map can use standard or library message types. If the planner and the link agree on a shared map message, it belongs in mullet-interfaces.

## Milestones

1. Build a map offline from a recorded bag (`ros2 bag` from mullet-localization's recorder) and view it in Foxglove.
2. Run the same pipeline live on the Orin next to OpenVINS, and measure CPU, GPU and memory.
3. Publish the local map at a rate a planner can use, and document its frame, resolution and latency.

## Done when

On a recorded flight, the map is geometrically consistent at a fixed resolution: obstacles do not smear or double as the drone moves. Running live on the Orin, mapping and VIO together stay within the Orin's budget while the ergodic framework could still meet its 16 ms deadline.

## Starting points

- Libraries: nvblox (GPU, from NVIDIA Isaac ROS), OctoMap, Voxblox.
- Data: bags recorded with mullet-localization's `record` service.
- The ergodic framework's 3D mode already plans on a 0.5 m voxel grid, built from the obstacles in its spec rather than sensed ones (`deploy/grid.py` in ergodic_mppi).

## Open questions

- LiDAR, depth camera, or both? The MID-360 sees farther; the D435i is denser at short range.
- Which representation: occupancy, a signed distance field, or both? The planner's needs decide.
- How does the map handle a pose correction from the estimator?
