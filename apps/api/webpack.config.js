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
      '@creo/voice-clone-api': join(__dirname, '../../libs/voice-clone/api/src/index.ts'),
      '@creo/scripts-api': join(__dirname, '../../libs/scripts/api/src/index.ts'),
      '@creo/storage-api': join(__dirname, '../../libs/storage/api/src/index.ts'),
      '@creo/prisma': join(__dirname, '../../libs/prisma/src/index.ts'),
      '@creo/auth-api': join(__dirname, '../../libs/auth/api/src/index.ts'),
      '@creo/projects-api': join(__dirname, '../../libs/projects/api/src/index.ts'),
      '@creo/projects-schema': join(__dirname, '../../libs/projects/schema/src/index.ts'),
      '@creo/media-library-api': join(__dirname, '../../libs/media-library/api/src/index.ts'),
      '@creo/video-ingest-api': join(__dirname, '../../libs/video-ingest/api/src/index.ts'),
      '@creo/video-analysis-api': join(__dirname, '../../libs/video-analysis/api/src/index.ts'),
      '@creo/video-render-api': join(__dirname, '../../libs/video-render/api/src/index.ts'),
    },
  },
  externals: [
    function ({ context, request }, callback) {
      // NestJS optional dependencies — not installed, safe to skip
      if (
        request === '@nestjs/microservices' ||
        request === '@nestjs/microservices/microservices-module' ||
        request === '@nestjs/websockets/socket-module' ||
        request === '@nestjs/platform-socket.io'
      ) {
        return callback(null, `commonjs ${request}`);
      }
      // Prisma generated client must stay external — its runtime uses
      // dynamic ESM loading of Error subclasses which breaks when
      // webpack mangles the module layout ("Must call super constructor
      // in derived class before accessing 'this'"). Node will resolve
      // it at runtime from the absolute path on disk.
      if (/^@prisma\//.test(request) || request === '.prisma/client') {
        return callback(null, `commonjs ${request}`);
      }
      if (context && request.startsWith('.')) {
        const abs = path.resolve(context, request);
        if (abs.startsWith(PRISMA_GENERATED_ABS)) {
          return callback(null, `commonjs ${abs}`);
        }
      }
      // Keep Remotion renderer / bundler out of the api bundle — they
      // are only loaded in apps/render-worker via forWorker() lazy
      // dynamic imports, but webpack still traces them.
      if (
        request === '@remotion/bundler' ||
        request === '@remotion/renderer' ||
        request === './video-render.processor.js' ||
        request === './remotion-renderer.js'
      ) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  plugins: [
    // file-type (ESM-only) is pulled via @nestjs/common's FileValidator
    // which we don't use. IgnorePlugin stops webpack from trying to
    // resolve it at build time.
    new webpack.IgnorePlugin({ resourceRegExp: /^file-type$/ }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      externalDependencies: 'none',
      mergeExternals: true,
    }),
  ],
};
