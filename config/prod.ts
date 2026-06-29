import type { UserConfigExport } from '@tarojs/cli';

export default {
  mini: {
    // 开启主包优化：尽量将公共模块放入分包，减小主包体积
    optimizeMainPackage: {
      enable: true,
    },
    webpackChain(chain) {
      // 开启 Tree Shaking，移除未使用的代码
      chain.optimization.usedExports(true);
      // 开启 Terser 压缩
      chain.optimization.minimize(true);
    },
  },
  h5: {},
} satisfies UserConfigExport<'webpack5'>;

