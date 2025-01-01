import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { globby } from 'globby';
import bundleSize from 'rollup-plugin-bundle-size';
import copy from 'rollup-plugin-copy';
import fs from 'fs-extra';
import nodeResolve from '@rollup/plugin-node-resolve';

// scan files to build
const files = (
  await globby('./src/*.ts', {
    ignore: ['**/*.spec.ts', 'example', 'util'],
  })
)
  .map((path) => ({
    path,
    shortPath: path.replace(/(\/src)|(\.ts)/g, '').replace('./index', '.'),
    esm: path.replace('/src/', '/dist/').replace('.ts', '.mjs'),
    cjs: path.replace('/src/', '/dist/').replace('.ts', '.cjs'),
    types: path.replace('/src/', '/dist/').replace('.ts', '.d.ts'),
  }))
  .sort((a, b) => (a.shortPath.toLowerCase() < b.shortPath.toLowerCase() ? -1 : 1));

// read original package.json
const pkg = await fs.readJSON('./package.json');

// create updated exports list from build files
pkg.exports = files.reduce((acc, file) => {
  acc[file.shortPath] = {
    import: file.esm,
    require: file.cjs,
    types: file.types,
  };

  return acc;
}, {});

// write updated package.json
await fs.writeJSON('./package.json', pkg, { spaces: 2, EOL: '\r\n' });

// noinspection JSUnusedGlobalSymbols
export default async () => {
  console.log(files.map((f) => f.path));

  return files.map((file) => ({
    input: file.path,
    output: [
      {
        format: 'esm',
        file: file.esm,
        sourcemap: false,
      },
      {
        format: 'cjs',
        file: file.cjs,
        sourcemap: false,
      },
    ],
    plugins: [
      nodeResolve(),
      typescript({ sourceMap: true, tsconfig: 'tsconfig.build.json' }),
      terser(),
      bundleSize(),
      copy({
        targets: [
          {
            src: ['LICENSE'],
            dest: 'dist',
          },
        ],
      }),
    ],
  }));
};
