const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const webpack = require('webpack');
const path = require('path');
const { join } = path;

const PRISMA_GENERATED_ABS = path.resolve(
  __dirname,
  '../../libs/prisma/generated/client',
);

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  resolve: {
    alias: {
      '@creo/prisma': join(__dirname, '../../libs/prisma/src/index.ts'),
      '@creo/storage-api': join(__dirname, '../../libs/storage/api/src/index.ts'),
      '@creo/auth-api': join(__dirname, '../../libs/auth/api/src/index.ts'),
      '@creo/video-render-api': join(__dirname, '../../libs/video-render/api/src/index.ts'),
    },
  },
  externals: [
    function ({ context, request }, callback) {
      if (
        request === '@nestjs/microservices' ||
        request === '@nestjs/microservices/microservices-module' ||
        request === '@nestjs/websockets/socket-module' ||
        request === '@nestjs/platform-socket.io'
      ) {
        return callback(null, `commonjs ${request}`);
      }
      if (/^@prisma\//.test(request) || request === '.prisma/client') {
        return callback(null, `commonjs ${request}`);
      }
      if (context && request.startsWith('.')) {
        const abs = path.resolve(context, request);
        if (abs.startsWith(PRISMA_GENERATED_ABS)) {
          return callback(null, `commonjs ${abs}`);
        }
      }
      // Keep Remotion renderer/bundler + their native deps as runtime
      // requires so webpack doesn't try to trace Chromium binaries.
      if (
        request === '@remotion/bundler' ||
        request === '@remotion/renderer' ||
        request === 'puppeteer-core' ||
        /^@remotion\//.test(request)
      ) {
        return callback(null, `commonjs ${request}`);
      }
      // The remotion-bundle package holds React/JSX code that Remotion's
      // own bundler will webpack at runtime. Keep it out of our build
      // graph so we never have to run ts-loader on Root.tsx.
      if (
        request === '@creo/video-player-remotion-bundle' ||
        request === '@creo/video-player-remotion-bundle/register' ||
        request === '@creo/video-player-feature' ||
        request === '@creo/video-player-data-access'
      ) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  plugins: [
    // file-type is an ESM-only package pulled transitively by
    // @nestjs/common's FileValidator (a pipe we don't use). Its
    // package.json "exports" field does not expose a CJS entry, so
    // webpack errors out while resolving it. IgnorePlugin short-
    // circuits resolution entirely; Nest code paths that reference it
    // are not executed in the worker.
    new webpack.IgnorePlugin({ resourceRegExp: /^file-type$/ }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      externalDependencies: 'none',
      mergeExternals: true,
    }),
  ],
};
