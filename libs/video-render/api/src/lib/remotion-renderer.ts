import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'node:path';
import * as os from 'node:os';
import * as crypto from 'node:crypto';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import type { RenderExportSettings } from './render-settings';

export interface RenderInput {
  inputProps: Record<string, unknown>;
  exportSettings: RenderExportSettings;
  onProgress?: (percent: number) => void;
}

export interface RenderOutput {
  outputPath: string;
  bytes: number;
  contentType: string;
}

const COMPOSITION_ID = 'editor';

@Injectable()
export class RemotionRenderer implements OnModuleInit {
  private readonly logger = new Logger(RemotionRenderer.name);
  private bundleLocation: string | null = null;
  private bundlePromise: Promise<string> | null = null;

  async onModuleInit() {
    // Kick bundling off eagerly — workers pay the ~30s cost once at boot
    // instead of on the first render job.
    this.ensureBundle().catch((err) =>
      this.logger.error(`Initial Remotion bundle failed: ${err.message}`, err.stack),
    );
  }

  private async ensureBundle(): Promise<string> {
    if (this.bundleLocation) return this.bundleLocation;
    if (this.bundlePromise) return this.bundlePromise;

    this.bundlePromise = (async () => {
      const entryPoint = this.resolveBundleEntry();
      this.logger.log(`Bundling Remotion entry: ${entryPoint}`);
      const location = await bundle({
        entryPoint,
        // Teach Remotion's internal webpack about our workspace's
        // `@creo/source` package.json export condition so it can resolve
        // @creo/* packages to their .ts sources (we don't publish dist/
        // for workspace libs).
        webpackOverride: (config) => ({
          ...config,
          resolve: {
            ...config.resolve,
            conditionNames: [
              '@creo/source',
              ...(config.resolve?.conditionNames ?? ['...']),
            ],
          },
        }),
      });
      this.logger.log(`Remotion bundle ready at ${location}`);
      this.bundleLocation = location;
      return location;
    })();

    return this.bundlePromise;
  }

  private resolveBundleEntry(): string {
    // Webpack would statically inline a naive `require.resolve()` to a
    // numeric module id even when the module is externalized. Build the
    // path from process.cwd() instead so it's resolved at runtime.
    // Override with REMOTION_ENTRY_POINT env for custom deployments.
    const override = process.env.REMOTION_ENTRY_POINT;
    if (override) return override;
    return path.join(
      process.cwd(),
      'libs/video-player/remotion-bundle/src/lib/register.ts',
    );
  }

  async render(input: RenderInput): Promise<RenderOutput> {
    const serveUrl = await this.ensureBundle();
    const containerFormat = this.containerFor(input.exportSettings.codec);
    const outputPath = path.join(
      os.tmpdir(),
      `remotion-${crypto.randomUUID()}.${containerFormat.extension}`,
    );

    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps: input.inputProps,
    });

    this.logger.log(
      `Rendering ${composition.width}x${composition.height}@${composition.fps}fps ` +
        `duration=${composition.durationInFrames}f codec=${input.exportSettings.codec}`,
    );

    await renderMedia({
      composition,
      serveUrl,
      codec: input.exportSettings.codec,
      crf: input.exportSettings.crf,
      pixelFormat: input.exportSettings.pixelFormat,
      outputLocation: outputPath,
      inputProps: input.inputProps,
      audioCodec: input.exportSettings.audioCodec,
      audioBitrate: input.exportSettings.audioBitrate,
      concurrency: null,
      onProgress: ({ progress }) => {
        input.onProgress?.(Math.round(progress * 100));
      },
    });

    const fs = await import('node:fs/promises');
    const stat = await fs.stat(outputPath);

    return {
      outputPath,
      bytes: stat.size,
      contentType: containerFormat.contentType,
    };
  }

  private containerFor(codec: RenderExportSettings['codec']): {
    extension: string;
    contentType: string;
  } {
    switch (codec) {
      case 'vp9':
        return { extension: 'webm', contentType: 'video/webm' };
      case 'prores':
        return { extension: 'mov', contentType: 'video/quicktime' };
      case 'h265':
      case 'h264':
      default:
        return { extension: 'mp4', contentType: 'video/mp4' };
    }
  }
}
