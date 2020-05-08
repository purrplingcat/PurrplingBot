import typescript from 'rollup-plugin-typescript2'
import replace from '@rollup/plugin-replace';
import pkg from './package.json'
import run from "./tools/hotreload.roolup"

const dev = process.env.ROLLUP_WATCH === 'true';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
    },
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],plugins: [
    typescript({
      typescript: require('typescript'),
      useTsconfigDeclarationDir: true,
    }),
    replace({
      __BOT_VERSION__: pkg.version,
      __BOT_CODENAME__: pkg.codename
    }),
    dev && run({
      execFile: __dirname + "/bin/run.js"
    }),
  ],
}
