const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

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
    },
  },
  externals: [
    function ({ request }, callback) {
      // NestJS optional dependencies — not installed, safe to skip
      if (
        request === '@nestjs/microservices' ||
        request === '@nestjs/microservices/microservices-module' ||
        request === '@nestjs/websockets/socket-module' ||
        request === '@nestjs/platform-socket.io'
      ) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  plugins: [
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
