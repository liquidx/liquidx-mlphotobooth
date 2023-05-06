# ML Photo Booth

This is a tech demo using the Tensorflow Face Landmark Detection models to create
a simple rendering of the mesh generated in real time and orientated it into the
same direction no matter which way you turn.

# Development

```
pnpm install
pnpm run dev
```

# Publishing Changes

Once the changes can be published, the built version of the library needs to be published to a
git branch called `svelte-package`. The package is contained within `dist/`.

Before updating, bump the version number in `package.json`.

```
git checkout svelte-package
pnpm run build
git push origin svelte-package
```

# Changelog

- 2023-05-06: Rewritten in SvelteKit as a Svelte component.
- 2021-06-12: Rewritten in a custom webpack form.
- 2020: Previously embedded into liquidx.net.
