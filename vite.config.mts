import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import nodeExternals from 'rollup-plugin-node-externals';
import { resolve } from 'path';

export default defineConfig({
	plugins: [
		{
			// typescript always external
			...nodeExternals({
				include: ['typescript'],
			}),
			enforce: 'pre',
		},
		// Generate d.ts files
		dts({
			tsconfigPath: resolve(import.meta.dirname, 'tsconfig.json'),
		}),
	],
	build: {
		lib: {
			entry: resolve(import.meta.dirname, 'src/index.ts'),
			fileName: `index.js`,
			formats: ['cjs'],
		},
		rollupOptions: {
			external: ['typescript'],
			output: {
				entryFileNames: `index.js`,
			},
		},
		minify: false,
		sourcemap: true,
		emptyOutDir: true,
	},
});
