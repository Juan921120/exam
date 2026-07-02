import type { UserConfigExport } from '@tarojs/cli';

export default {
  mini: {
    optimizeMainPackage: {
      enable: true,
    },
    component: {
      onDemand: true,
    },
    webpackChain(chain) {
      chain.optimization.usedExports(true);
      chain.optimization.minimize(true);
    },
  },
  h5: {},
} satisfies UserConfigExport<'webpack5'>;

