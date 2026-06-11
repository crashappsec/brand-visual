# shadcn component registry

Crash Override publishes brand-themed shadcn/ui components through a shadcn
registry. Use this when building UI on shadcn/ui so components arrive already
on-brand. For the raw variable values that back the theme, read
`tokens-shadcn.md`.

## Registry endpoint

Components resolve from:

```
https://crashappsec.github.io/react-design-system/r/{name}.json
```

`{name}` is the component name (for example `button`, `card`, `dialog`).

## Namespace config (components.json)

Register the Crash Override namespace in your project `components.json` so the
CLI knows where `@crashoverride/*` resolves:

```json
{
  "registries": {
    "@crashoverride": "https://crashappsec.github.io/react-design-system/r/{name}.json"
  }
}
```

## Install usage

Add a component with the namespaced name:

```
npx shadcn add @crashoverride/<name>
```

For example:

```
npx shadcn add @crashoverride/button
```

## Versioning

A versioned pin is planned: a `r/v1/` path segment
(`https://crashappsec.github.io/react-design-system/r/v1/{name}.json`) that locks
consumers to a stable major. It lands in Phase 2. Until then, the unversioned
`r/{name}.json` endpoint above is the current entry point.
