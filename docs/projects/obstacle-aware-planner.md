# Obstacle-aware planner

## Goal

A mission framework that flies the drone to goals, or along a route, while avoiding obstacles it senses in flight, not only the ones drawn in a spec. It replans on the onboard map and streams a smooth, flyable trajectory to the supervisor.

## Fits into the stack as

A mission framework, following the [framework contract](../frameworks/index.md): it serves `LoadMission` and `ListMissions`, publishes `MissionStatus`, streams `MissionCommand` in `TRAJECTORY_3D` mode, and never publishes to PX4. The supervisor keeps arming, takeoff, landing and holds, so every failure of the planner ends in a hold. [Ergodic MPPI](../frameworks/ergodic-mppi.md) is the working example to copy the node structure, preflight and test harness from.

## Inputs and outputs

| Direction | Data | Type |
| --- | --- | --- |
| reads | the mission: goals or a route, limits, a geofence | a new spec schema, for example `goto/1`, drawn in the Mission Builder |
| reads | the local map | from [Onboard mapping](onboard-mapping.md) |
| reads | the drone's state | `DroneHeartbeat`, `VehicleLocalPosition` |
| writes | the trajectory | `MissionCommand`, `TRAJECTORY_3D`, at about 50 Hz |
| writes | status and preflight | `MissionStatus` |

## Contract changes

None in mullet-interfaces or the supervisor: the existing framework contract covers it. Paddock needs a builder for the new spec schema in the Mission Builder.

## Milestones

1. Plan and fly to a goal in the SIH or SITL simulator, around obstacles given in the spec.
2. Replace the spec's obstacles with the onboard map, replayed from a bag.
3. Fly it in SIH on the bench with the live map pipeline running, then outdoors.

## Done when

In SIH or SITL, the drone reaches every goal of a test scene through obstacles it has to sense, with no collision, no entry into the safety margin, and no hold forced by a stale command stream. The plan's curvature stays within what the drone can track.

## Starting points

- EGO-Planner (gradient-based B-spline planning that needs no distance field), MPC-based local planners, and sampling planners like the ergodic framework's MPPI.
- The ergodic framework's bench harness: `tests/sitl/run_sih.sh`, the flight recorder, and the tracking report.
- A measured fact about these drones: the tracking error in the trajectory modes comes from path curvature, not from PX4's delay. Models of PX4's lag were tried in SIH and did not improve tracking. Bound the curvature in the planner rather than modelling the lag.

## Open questions

- How does the drone behave when the map has unknown space ahead: slow down, stop, or treat it as an obstacle?
- Does the planner replan from its own previous plan, as the ergodic trajectory modes do, or from each measurement?
