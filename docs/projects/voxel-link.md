# Compressed voxel link

## Goal

The operator sees the drone's map, live, over a long-range radio link with little bandwidth. The drone compresses its voxel map into a stream that fits a fixed bandwidth cap, the ground station decompresses it, and Paddock shows it in 3D.

Today the ground station can see sensor data only over Wi-Fi, through Foxglove: a raw MID-360 cloud alone is about 5 MB/s. A long-range link offers a small fraction of that, so the drone must send the map, not the sensor data, and only the parts that changed.

## Fits into the stack as

Three parts:

- An encoder on the drone, next to [Onboard mapping](onboard-mapping.md).
- A decoder on the ground station, feeding Paddock's gateway.
- A 3D map view in Paddock, built like the Mission Builder's 3D view.

The transport is a serial radio, not ROS 2 over DDS. DDS discovery and reliability traffic do not fit a link this narrow.

## Inputs and outputs

| Direction | Data | Type |
| --- | --- | --- |
| reads (drone) | the global voxel map and its updates | from onboard mapping |
| writes (radio) | packets of map changes, within the bandwidth cap | an encoding the project defines |
| writes (ground) | the reconstructed map | served by the gateway to the UI |

## Contract changes

- A versioned packet format, documented like a spec schema.
- A new gateway adapter for the radio, and a map endpoint in Paddock's API.
- No change to the supervisor.

## Milestones

1. **Offline import.** Paddock loads a map or point cloud file (a PCD, or a bag converted offline) and shows it as voxels. This builds the viewer with no radio at all.
2. **Encoder and decoder on a recording.** Replay a bag, encode the map's changes at a fixed cap, decode them, and compare the result with the onboard map.
3. **Over the radio.** The same pipeline over the real link, measured in the field.

## Done when

On a bag replay at a fixed cap, for example 10 kB/s, the ground map converges to the onboard map. Report the fraction of voxels that match after the flight, and the delay between a voxel changing on the drone and appearing on the ground. Packets lost on the link do not corrupt the ground map.

## Starting points

- Octree map encodings (OctoMap's binary format) and change-only updates between map versions.
- Priority schemes that send what is near the drone, or newly observed, first.
- The Mission Builder's 3D view (MapLibre with extrusions) for the renderer.

## Open questions

- Which radio, and what bandwidth and loss does it really give at range?
- Lossless or lossy encoding? Coarser voxels far from the drone?
- How does the ground station recover after a long outage: a full resend, or a snapshot plus changes?
