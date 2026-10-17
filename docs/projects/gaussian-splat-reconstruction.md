# Gaussian splat reconstruction

## Goal

After a flight, the ground station builds a photorealistic 3D model of the area, a 3D Gaussian splat, from the images and poses the drone recorded. The operator opens it in Paddock to inspect the site from any viewpoint.

The work happens on the ground, after the flight. Training a splat needs far more compute than the Orin has to spare, and the planner needs to know which space is occupied, which the voxel map already answers.

## Fits into the stack as

A ground-station pipeline with three steps: fetch a flight's recording from the drone, train a splat on a GPU, and show it in a new Paddock view. It needs no changes on the drone beyond recording camera frames.

## Inputs and outputs

| Direction | Data | Type |
| --- | --- | --- |
| reads | colour frames from the D435i | from the flight's bag |
| reads | the camera pose at each frame | from VIO or LIO, in the same bag |
| reads | MID-360 points, to seed the Gaussians | from the bag |
| writes | the trained splat | a standard splat file |
| writes | a view in Paddock | a WebGL splat viewer |

Recorded poses are a head start: most splat pipelines first have to estimate the camera poses with structure from motion (COLMAP), and the stack already provides them.

## Contract changes

None on the drone. Paddock needs a viewer and a way to list and open reconstructions.

## Milestones

1. Train a splat from one recorded flight, offline, with an existing pipeline and the recorded poses.
2. Seed the Gaussians from the LiDAR points and compare quality and training time against seeding from images alone.
3. Show the result in Paddock.

## Done when

A splat from a recorded flight renders in Paddock, and its quality is measured on frames held out of training (PSNR and SSIM), compared against a reconstruction that estimates its own poses.

## Starting points

- 3D Gaussian Splatting (Kerbl et al., 2023), and its open implementations such as gsplat.
- LiDAR-seeded splatting methods.
- Web splat viewers, to embed in Paddock.

## Open questions

- The D435i's colour camera has a rolling shutter. Does motion blur force slow flights for reconstruction, or a better camera?
- **Thesis extension:** a progressive splat over the [compressed voxel link](voxel-link.md). The voxel map goes first; compressed keyframes follow as bandwidth allows, and the ground refines the splat during the flight.
