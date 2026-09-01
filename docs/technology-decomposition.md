# Technology Decomposition

Technology decomposition extends the relationship graph after the adoption funnel:

`Technology → System → Subsystem → Component → Material → Supplier → Company`

The first reusable theme is GNSS-Denied Autonomous Systems. Its vocabulary includes
resilient PNT, autonomous and inertial navigation, INS/IMU, flight control, edge computing
and AI, machine and visual navigation, RF/data links, EW resilience, EO/IR sensing, ESCs,
electric motors, and autonomy software.

The taxonomy is not a bill of materials. Every configured link defaults to `INFERRED`.
A platform-specific `USES_COMPONENT`, `USES_MATERIAL`, `SUPPLIES`, or
`POTENTIAL_SUPPLIER` edge needs independent evidence. This prevents a common research
error: projecting a generic architecture onto every product in a category.

Materials and supplier resolution are deliberately unseeded in Phase 1 because adding
named suppliers without source evidence would fabricate the graph.
