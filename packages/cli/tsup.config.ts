import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/index.ts' },
  format: 'esm',
  target: 'node22',
  bundle: true,
  clean: true,
  minify: false,
  sourcemap: false,
  noExternal: [/@provena\//],
})