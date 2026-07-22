# Your career has a source of truth.

LinkedIn, your résumé, your website, and your speaker bios are all different representations of the same thing. They should not be maintained separately.

```
          Profile
             |
     -----------------
     |       |       |
  Résumé  LinkedIn  Website
```

Maintain one canonical model. Generate every platform-specific representation from it.

[Concept →](/concept) [Examples →](/examples) [Architecture →](/architecture)

---

## Before

```
LinkedIn      Résumé       Website
    |            |            |
 Experience   Experience   Experience
    |            |            |
   Skills       Skills       Skills
    |            |            |
  Projects     Projects     Projects

   Three copies. Always diverging.
```

## After

```
               Profile
                  |
         -----------------
         |       |       |
      Résumé  LinkedIn  Website

   One source. Deterministic projections.
```

---

## How it works

```
YAML files → Profile → Projection → Renderer → Output
```

**Identity is knowledge. Documents are projections. Facts over formatting. Evidence over claims.**

Your career is not a collection of profiles. It is a body of knowledge with many representations.
