const { fork } = require("child_process")

export default function run(opts = {}) {
  let proc;

  const args = opts.args || [];
  const forkOptions = opts.options || opts;
  delete forkOptions.args;

  return {
    name: 'run',

    buildStart(options) {
      let inputs = options.input;

      if (typeof inputs === 'string') {
        inputs = [inputs];
      }

      if (typeof inputs === 'object') {
        inputs = Object.values(inputs);
      }

      if (inputs.length > 1) {
        throw new Error(`@rollup/plugin-run only works with a single entry point`);
      }
    },

    generateBundle(_outputOptions, _bundle, isWrite) {
      if (!isWrite) {
        this.error(`@rollup/plugin-run currently only works with bundles that are written to disk`);
      }
    },

    writeBundle() {
      const entryFileName = opts.execFile;

      if (entryFileName) {
        if (proc) proc.kill();
        proc = fork(entryFileName, args, forkOptions);
      } else {
        this.error(`@rollup/plugin-run could not find output chunk`);
      }
    }
  };
}
