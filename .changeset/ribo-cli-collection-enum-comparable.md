---
"@azx/ribo-cli": patch
---

A collection leaf whose type is an enum or a literal is judged again instead of always scoring
`unscorable` (`incomparable-expectation`). Its expectation is an ordinal-keyed object
(`{ "0": "Furnace", "1": "Boiler" }`), and the comparability check compared that whole object to
the schema's members — which no object ever is — so every collection enum cell left every
denominator. On the Snugg corpus that was 91 of the asserted cells, every case affected, including
`hvac.hvacSystemEquipmentType`. The check now tests each element against the members (and each
alternative's elements the same way); an expectation naming a non-member is still unscorable.
