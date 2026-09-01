# Intelligence Funnel

The funnel encodes maturity of government adoption, not company quality or market value.

| Stage | Meaning | Typical evidence |
| --- | --- | --- |
| 0 | Strategic need / problem | Mission gap, research priority |
| 1 | Government demand formation | RFI, Sources Sought, BAA, solicitation |
| 2 | R&D / early funding | DARPA research, SBIR/STTR, AFWERX topic |
| 3 | Prototype / selection | DIU selection, prototype or experimental award |
| 4 | Validation | Successful prototype, Success Memo, operational evaluation |
| 5 | First operational procurement | Initial production order, meaningful follow-on |
| 6 | Production | Repeat procurement, production contract, capacity expansion |
| 7 | Structural scale | Multi-year buy, capacity reservation, prime integration |

`calculateFunnelStage` takes strategic events, excludes records with no evidence or only
speculative evidence, finds the highest supported stage, and returns the exact supporting
events plus excluded records and an explanation. Stage is therefore a projection of the
evidence graph—not a mutable label stored without context.

An entity can have evidence at several stages. Reaching stage 6 does not delete the earlier
research trail, and a different technology or program connected to the same company may be
at another stage.

After stage 7, analysis proceeds into system → subsystem → component → material → supplier.
These layers are graph decomposition, not additional adoption stages.
