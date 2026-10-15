# Frameworks

A mission framework is a separate node that flies the drone **only while** `mullet_core` is in `MISSION`.

```text
paddock  --LoadMission-->  framework  --MissionCommand-->  mullet_core  -->  PX4
         <--MissionStatus--             <--heartbeat, local position--
```

Rules:

- Stream `MissionCommand` on `<ns>/command`. Core forwards it only in `MISSION`. Stale or out-of-state → core holds.
- Serve `LoadMission` and `ListMissions`; publish `MissionStatus` on `/mullet/mission_status` with `load_service_path` and `spec_schema`. Paddock discovers frameworks from that topic alone.
- Loading prepares. The operator starts with `start_mission` when status is `READY`.
- **Never** publish `/fmu/in/*`. A refusal ends in core's own hold.

Wire types live in [mullet-interfaces](../stack/interfaces.md).

| Framework | Schema | Repo |
| --- | --- | --- |
| [Ergodic MPPI](ergodic-mppi.md) | `ergodic/3` | `skymule-ai/ergodic_mppi` |
