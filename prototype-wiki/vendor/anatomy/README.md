# Anatomy SVG kit

The unmodified `iso-kit.mjs` and `iso.css` come from
[wheresryan22/anatomy](https://github.com/wheresryan22/anatomy), downloaded on
2026-10-15 under the included MIT license. They support the address-space
illustrations; no package installation is needed to view or rebuild that page.

Rebuild the precomputed illustration geometry from the repository root:

```powershell
node scripts/build-address-space-anatomy.mjs
```

OSLab adapts the original skill's presentation to course terminology: cells are
illustrative virtual addresses; links show mappings, not physical wires. Object
values are read from the existing address-space model. There is no WebGL layer
or additional operating-system simulation.

The current figure compares private and shared mappings in parallel. Private
addresses A:6 and B:6 lead to two records; shared addresses A:6 and B:10 lead to
one record. The generated geometry contains wide and compact versions of each
case. Runtime writing and reading follow deterministic model snapshots; the
geometry encodes no operating-system state.
