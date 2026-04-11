import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoElement } from '@twick/timeline';
import type { PanelProps } from '@twick/studio';
import { useApp } from '@creo/ui';
import { MediaLibraryPanel } from '@creo/media-library-feature';
import type { MediaAsset } from '@creo/media-library-data-access';

/**
 * Custom Twick tool panel ("creo-media") shown in place of Twick's built-in
 * "Video" tool. Renders our MediaLibraryPanel (upload + grid of user uploads)
 * and hands every asset click off to Twick's injected `addElement` callback,
 * which drops the clip onto the currently-selected video track and triggers
 * a changeLog bump so AutoSaveBridge persists the timeline.
 *
 * Registered via `StudioConfig.customPanels['creo-media']` in
 * {@link ./TwickStudioHost.tsx}.
 */
export function CreoMediaPanel(props: PanelProps) {
  const { videoResolution, addElement } = props;
  const { t } = useTranslation();
  const { message } = useApp();

  const handleAssetClick = useCallback(
    async (asset: MediaAsset) => {
      if (asset.status !== 'ready') {
        message.warning(t('media.stillProcessing'));
        return;
      }
      if (!asset.url) {
        message.error(t('media.noUrl'));
        return;
      }
      if (asset.kind !== 'video') {
        message.info(t('media.onlyVideoForNow'));
        return;
      }
      if (!addElement) {
        message.error(t('media.addFailed'));
        return;
      }

      try {
        const element = new VideoElement(asset.url, videoResolution);
        await element.updateVideoMeta();
        addElement(element);
      } catch (err) {
        console.error('[CreoMediaPanel] add failed:', err);
        message.error(err instanceof Error ? err.message : t('media.addFailed'));
      }
    },
    [addElement, videoResolution, message, t],
  );

  return <MediaLibraryPanel onAssetClick={handleAssetClick} />;
}
