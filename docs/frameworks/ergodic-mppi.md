# Ergodic MPPI

The ergodic framework flies one drone so that, over the length of a mission, the time it spends in each part of an area matches a density the operator draws: more time where the density is high, less where it is low, none inside obstacles. It plans with model predictive path integral control (MPPI) in JAX, on the Orin's GPU, at 50 Hz.

Repository: [skymule-ai/ergodic_mppi](https://github.com/skymule-ai/ergodic_mppi), which holds the controller, the ROS 2 node, the Orin image, and the SITL and SIH test tools. Algorithm research continues in [invidia0/ergodic_control_mppi](https://github.com/invidia0/ergodic_control_mppi); its tag `mullet-deploy-final` marks where the drone version split off. This page describes the drone version.

## The coverage problem

The operator describes the area of interest as a Gaussian mixture over positions $x \in \mathbb{R}^d$ ($d = 2$ for a planar mission, $d = 3$ in 3D):

$$
p(x) = \sum_{j=1}^{J} w_j \, \mathcal{N}(x;\, \mu_j, \Sigma_j),
\qquad \sum_{j} w_j = 1 .
$$

A trajectory $x(t)$ is *ergodic* with respect to $p$ when its time-averaged occupancy converges to $p$:

$$
\lim_{T \to \infty} \frac{1}{T} \int_0^T \mathbf{1}\big[x(t) \in A\big] \, dt = \int_A p(x) \, dx
\quad \text{for every region } A .
$$

The controller does not minimise an ergodic metric directly. It follows a velocity field that pulls the drone toward high density and pushes it away from where it has already been, and MPPI turns that field into a trajectory the drone can fly. After a flight, `coverage_report.py` measures the result as the total-variation distance between the flown occupancy and $p$, on 2 m cells: 0 is perfect coverage.

## Vehicle model

The planner uses a double integrator with a heading, stepped at $\Delta t = 0.02$ s:

$$
s = \begin{bmatrix} x \\ v \\ \psi \\ \dot\psi \end{bmatrix} \in \mathbb{R}^{2d+2},
\qquad
u = \begin{bmatrix} a \\ \ddot\psi \end{bmatrix} \in \mathbb{R}^{d+1},
$$

$$
x_{t+1} = x_t + v_t \Delta t + \tfrac{1}{2} a_t \Delta t^2,
\qquad
v_{t+1} = v_t + a_t \Delta t ,
$$

and the same for $\psi$ and $\dot\psi$. Each acceleration is clipped to its limit before it is applied. All states are in PX4 local NED.

## The reference field

The field is the gradient of a scalar potential $\Phi$, which combines an attraction to the density with two repulsions:

$$
\Phi(x) = \log \tilde p(x)
\;-\; k_M\, g \Big[ (1 - a)\, K_{\text{trail}}(x) + a\, \gamma\, K_{\text{excess}}(x) \Big]
\;-\; k_P\, g\, K_{\text{plan}}(x) .
$$

Each $K$ is a weighted kernel sum over a set of points $\{m_i\}$, using a Gaussian kernel with bandwidth $h$:

$$
K(x) = \frac{\sum_i \omega_i\, \kappa_h(x, m_i)}{\sum_i \omega_i},
\qquad
\kappa_h(x, m) = \exp\!\left(-\frac{\lVert x - m \rVert^2}{h}\right),
\qquad
g = \sqrt{\tfrac{e h}{2}} .
$$

The factor $g$ scales the kernel's steepest gradient to 1, so the gains $k_M$ and $k_P$ compare directly with the attraction.

| Term | Points $m_i$ | Weights $\omega_i$ | Effect |
| --- | --- | --- | --- |
| $\log \tilde p$ | — | — | Pulls toward the density. $\tilde p$ is $p$ with its weights shifted toward components the drone has visited less than their share. |
| $K_{\text{trail}}$ | positions the drone has flown | recency $\rho_i = e^{-\text{age}_i / \tau_M}$ | Pushes away from the recent path, so the drone does not retrace it. |
| $K_{\text{excess}}$ | positions the drone has flown | $\rho_i \, e_i$, the recency times the over-coverage there | Pushes away from places already covered more than $p$ asks for. $\gamma \in [0, 1)$ switches this term off when nothing is over-covered. |
| $K_{\text{plan}}$ | the $T$ points of the current plan | 1 | Spreads the plan out, so the drone fills an area instead of circling. |

The over-coverage at a flown point compares the kernel estimate of the occupancy, $\hat o$, with the density smoothed by the same kernel, $p_h$: $e_i = \max\big(\hat o(m_i) - p_h(m_i),\, 0\big) / \big(p_h(m_i) + \varepsilon\big)$.

The reference velocity points along $\nabla \Phi$, with a speed set by a schedule:

$$
v_{\text{ref}}(x) = \sigma_v(x)\, \frac{\nabla \Phi(x)}{\max\!\big(\lVert \nabla \Phi(x) \rVert,\, 10^{-3}\big)} .
$$

The schedule $\sigma_v$ is slow, at $v_0$, on a density peak, and up to $\beta$ times faster in the corridors between peaks, since a path's time density is inversely proportional to its speed. Once the peak the drone is in has had its share of recent flight time, a *service gate* releases the slow-down so the drone moves on.

## MPPI

Each control step samples $K$ control sequences of length $T$ around the previous plan $\bar u$ and scores them. For a fraction of the samples (10 % by default) the previous plan is dropped and the sequence is pure noise, which keeps the planner exploring.

$$
u^k_t = \bar u_t + \epsilon^k_t, \qquad \epsilon^k_t \sim \mathcal{N}(0, \Sigma_u) .
$$

The cost of sample $k$ adds a state cost and a tracking cost that rewards moving along the reference field:

$$
S_k = \sum_{t=0}^{T-1} \Big[ c(s^k_t)
\;+\; w_{\text{track}} \Big( -\Delta t \, v_{\text{ref}}(\bar x_t) \cdot \Delta x^k_t + \tfrac{1}{2} \lVert \Delta x^k_t \rVert^2 \Big) \Big],
$$

where $\Delta x^k_t$ is the sample's displacement in step $t$, and $\bar x_t$ is the median position of all samples at step $t$. The state cost $c$ charges a fixed cost for entering an inflated obstacle or leaving the area, a quadratic cost inside the boundary margin, and the occupied cells of the planning grid. A control-cost term, weighted by $\lambda (1 - \alpha)$, is zero in the shipped profile, which sets $\alpha = 1$.

The new plan is the cost-weighted average of the samples, smoothed with a moving average along the horizon:

$$
\omega_k = \frac{\exp\!\big(-(S_k - \min_j S_j)/\lambda\big)}{\sum_i \exp\!\big(-(S_i - \min_j S_j)/\lambda\big)},
\qquad
\bar u \leftarrow \bar u + \sum_k \omega_k \big(u^k - \bar u\big) .
$$

The temperature $\lambda$ adapts so that the effective sample size $\mathrm{ESS} = 1 / \big(K \sum_k \omega_k^2\big)$ stays near its target:

$$
\lambda \leftarrow \operatorname{clip}\!\Big(\lambda\, e^{\,0.05\,(\mathrm{ESS}^\ast - \mathrm{ESS})},\; \lambda_{\min},\; \lambda_{\max}\Big) .
$$

The drone flies the first control of the plan, and the rest of the plan, shifted by one step, seeds the next step.

### Symbols and shipped values

The values come from `configs/uav_profile.yaml`.

| Symbol | Meaning | Value |
| --- | --- | --- |
| $d$ | position dimension | 2 (planar) or 3 |
| $\Delta t$ | control and model step | 0.02 s (50 Hz) |
| $T$ | planning horizon | 150 steps (3 s) |
| $K$ | samples per step | 250 |
| $\alpha$ | control-cost weight | 1.0 |
| $\mathrm{ESS}^\ast$ | target effective sample size, as a fraction of $K$ | 0.3 |
| $h$ | kernel bandwidth | 0.94 m² |
| $k_M$ | memory gain | 60 |
| $a$ | balance between trail and over-coverage repulsion | 0.85 |
| $\tau_M$ | memory time constant | 5.5 s |
| $k_P$ | plan self-repulsion gain | 6 |
| $v_0$ | reference speed on a density peak | 1.8 m/s |
| $\beta$ | corridor speed-up | 4 |

A spec's `max_speed_mps` rescales the speed schedule and stretches the memory windows by the same factor, so the trail the drone avoids keeps its length in metres.

## Mission spec

Paddock's Mission Builder writes the spec; the full format, with an example, is in the repository's README. The spec is `ergodic/3`: version 2 added the 3D modes, the ceiling, obstacle heights and density altitudes, and version 3 added density pitch and roll and `max_vertical_speed_mps`. The drone refuses unknown and missing keys.

- Points are WGS84 `[lat, lon]` in degrees. Sizes are in metres, bearings in degrees clockwise from north, and heights in metres above the EKF origin (see [Conventions](../concepts/conventions.md#coordinate-frames)).
- The area polygon is the geofence. It may be non-convex, but must not cross itself.
- Every obstacle, the area edge, the ground and the ceiling are grown by a safety margin computed from the `vehicle` block: radius, clearance, tracking allowance, and the stopping distance at full speed.
- Every density peak must lie in free space connected to the heaviest one.

| `command_mode` | Planning | What PX4 tracks |
| --- | --- | --- |
| `trajectory` (default) | planar, on a 0.15 m grid | the planned position, with velocity and acceleration feedforward |
| `velocity`, `acceleration` | planar | the planned velocity, or the acceleration |
| `trajectory_3d`, `velocity_3d`, `acceleration_3d` | 3D, on a 0.5 m voxel grid; the drone may fly over obstacles lower than the ceiling | the same, on all three axes |

The trajectory modes plan from their own previous plan rather than from each measurement, and send PX4 the planned position, so PX4's position loop corrects the tracking error. The velocity and acceleration modes replan from every measurement, and PX4's response lag (about 0.2 s delay, 0.6 s time constant on the SIH bench) makes them drift into the margins. Use them only for comparison.

## Interfaces

The node takes one parameter, `drone_id`, and reads every other name from that drone's heartbeat. It also takes `deadline_ms`, 16 ms by default.

| Direction | Name | Type | Rate |
| --- | --- | --- | --- |
| subscribes | `/mullet/heartbeat` | `DroneHeartbeat` | 10 Hz |
| subscribes | `<PX4 prefix>/fmu/out/vehicle_local_position_v1` | `px4_msgs/VehicleLocalPosition` | from PX4 |
| publishes | `<namespace>/command` | `MissionCommand` | 50 Hz |
| publishes | `/mullet/mission_status` | `MissionStatus` | 2 Hz |
| serves | `<namespace>/mission/ergodic/load`, `…/list` | `LoadMission`, `ListMissions` | — |
| calls | the heartbeat's `hold_service_path` | `std_srvs/Trigger` | on `DONE` and `FAULT` |

Every accepted spec is saved on the drone as `<UTC stamp>_<mission_id>.json` in the `docker/mission/missions` volume. `ListMissions` returns the newest 50, and nothing is deleted.

## Real-time budget

On the Orin Nano at 15 W, one controller step takes 7.1 ms at the median and 13.6 ms at the 99th percentile on the GPU, against 45 ms and 69 ms on the CPU. A full cycle, including the transfers to and from the GPU, takes 15.2 ms at the 99th percentile, inside the 20 ms period. The preflight refuses a mission when the 99th-percentile step exceeds `deadline_ms`, so a drone without a working GPU refuses to fly rather than fly late. At MAXN_SUPER the preflight measures 14.6 ms.

## Build and test

```bash
JAX_PLATFORMS=cpu uv run python -m unittest discover -s tests -v
```

Clone with `--recursive`: mullet-interfaces is a submodule at `ros2/mullet-interfaces`. Deployment, the status values, the preflight checks and the bench test are on [Running a framework](../on-field/frameworks.md).

## Source of truth

The repository's `README.md`. The code for the field is in `ergodic_control_mppi/mppi/field.py`, the MPPI update in `mppi/core.py`, and the dynamics in `models/double_integrator.py`.
