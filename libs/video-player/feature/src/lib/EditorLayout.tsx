import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { Button } from 'antd';
import {
  CustomerServiceOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  ScissorOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  useEditorStore,
  computeDuration,
  createClipFromAsset,
  createDefaultTextClip,
  getClipById,
} from '@creo/video-player-data-access';
import type { MediaAsset } from '@creo/media-library-data-access';
import { EditorComposition } from './remotion/EditorComposition';
import { LeftSidebar } from './sidebar/LeftSidebar';
import { PropertiesPanel } from './properties/PropertiesPanel';
import { TransformOverlay } from './canvas/TransformOverlay';
import { Timeline } from './timeline/Timeline';
import { useAutoSave } from './hooks/useAutoSave';
import { pxToSeconds } from './timeline/timeScale';
import styles from './RemotionPlayerPage.module.scss';

export const EditorLayout = () => {
  const doc = useEditorStore((s) => s.doc);
  const playhead = useEditorStore((s) => s.playhead);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const selection = useEditorStore((s) => s.selection);

  const setPlayhead = useEditorStore((s) => s.setPlayhead);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setSelection = useEditorStore((s) => s.setSelection);
  const addClip = useEditorStore((s) => s.addClip);
  const updateClip = useEditorStore((s) => s.updateClip);
  const removeClip = useEditorStore((s) => s.removeClip);
  const splitClipAtPlayhead = useEditorStore((s) => s.splitClipAtPlayhead);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);

  const playerRef = useRef<PlayerRef>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Track active drag for overlay preview
  const [activeDragAsset, setActiveDragAsset] = useState<MediaAsset | null>(null);
  const [activeDragLabel, setActiveDragLabel] = useState<string | null>(null);

  useAutoSave();

  const clipboardRef = useRef<Array<{ clip: import('@creo/video-player-data-access').Clip; trackId: string }>>([]);
  const lastPlayerFrameRef = useRef(0);

  const duration = useMemo(() => Math.max(1, computeDuration(doc)), [doc]);
  const durationInFrames = Math.max(1, Math.round(duration * doc.fps));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onFrame = (e: { detail: { frame: number } }) => {
      const state = useEditorStore.getState();
      if (!state.isPlaying) return;
      lastPlayerFrameRef.current = e.detail.frame;
      const seconds = e.detail.frame / doc.fps;
      if (Math.abs(seconds - state.playhead) > 1e-4) {
        setPlayhead(seconds);
      }
    };
    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('frameupdate', onFrame as never);
    return () => {
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('frameupdate', onFrame as never);
    };
  }, [doc.fps, setIsPlaying, setPlayhead]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || isPlaying) return;
    const targetFrame = Math.round(playhead * doc.fps);
    const currentFrame = player.getCurrentFrame();
    if (Math.abs(targetFrame - currentFrame) <= 0) return;
    player.seekTo(targetFrame);
    lastPlayerFrameRef.current = targetFrame;
  }, [playhead, isPlaying, doc.fps]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // Escape — deselect
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelection([]);
        return;
      }
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        const state = useEditorStore.getState();
        const ids = state.selection.clipIds;
        if (ids.length === 0) return;
        e.preventDefault();
        clipboardRef.current = ids
          .map((id) => {
            const found = getClipById(state.doc, id);
            if (!found) return null;
            return { clip: JSON.parse(JSON.stringify(found.clip)), trackId: found.track.id };
          })
          .filter(Boolean) as Array<{ clip: import('@creo/video-player-data-access').Clip; trackId: string }>;
        return;
      }
      // Paste
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        if (clipboardRef.current.length === 0) return;
        e.preventDefault();
        const ph = useEditorStore.getState().playhead;
        const earliest = Math.min(...clipboardRef.current.map((c) => c.clip.positionStart));
        const newIds: string[] = [];
        for (const entry of clipboardRef.current) {
          const offset = entry.clip.positionStart - earliest;
          const duration = entry.clip.positionEnd - entry.clip.positionStart;
          const newId = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          const pasted = {
            ...JSON.parse(JSON.stringify(entry.clip)),
            id: newId,
            trackId: entry.trackId,
            positionStart: ph + offset,
            positionEnd: ph + offset + duration,
          };
          addClip(entry.trackId, pasted);
          newIds.push(newId);
        }
        setSelection(newIds);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        const player = playerRef.current;
        if (!player) return;
        if (isPlaying) player.pause();
        else player.play();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = useEditorStore.getState().selection.clipIds;
        if (ids.length === 0) return;
        e.preventDefault();
        for (const id of ids) removeClip(id);
        return;
      }
      if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        splitClipAtPlayhead();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, redo, undo, removeClip, splitClipAtPlayhead, setSelection]);

  // Click outside editor to deselect (but ignore Ant Design popover portals)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const page = pageRef.current;
      if (!page) return;
      const target = e.target as HTMLElement;
      if (page.contains(target)) return;
      // Ant Design renders popovers/dropdowns/color-pickers in body portals
      if (target.closest('.ant-popover, .ant-dropdown, .ant-select-dropdown, .ant-color-picker-panel, .ant-color-picker, .ant-modal, .ant-collapse')) return;
      setSelection([]);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [setSelection]);

  const handleDropAsset = useCallback(
    (asset: MediaAsset, event: DragEndEvent) => {
      if (asset.status !== 'ready') return;
      // Only add clip when dropped onto a timeline track
      const over = event.over;
      if (!over || over.data.current?.kind !== 'track') return;
      const trackId = over.data.current.trackId as string;

      const currentDoc = useEditorStore.getState().doc;
      const activatorEvent = event.activatorEvent as PointerEvent | null;
      const delta = event.delta;
      const dropClientX = (activatorEvent?.clientX ?? 0) + delta.x;
      const trackDom = document.querySelector<HTMLElement>(
        `[data-track-id="${trackId}"]`,
      );
      let positionStart = useEditorStore.getState().playhead;
      if (trackDom) {
        const rect = trackDom.getBoundingClientRect();
        const xInLane = dropClientX - rect.left;
        positionStart = Math.max(0, pxToSeconds(xInLane, useEditorStore.getState().zoom));
      }

      const clip = createClipFromAsset(asset, trackId, positionStart, currentDoc);
      if (clip) addClip(trackId, clip);
    },
    [addClip],
  );

  const handleDropTextPreset = useCallback(
    (preset: { id: string; label: string; styleOverrides: Record<string, unknown> }, event: DragEndEvent) => {
      const over = event.over;
      if (!over || over.data.current?.kind !== 'track') return;
      const trackId = over.data.current.trackId as string;
      const currentDoc = useEditorStore.getState().doc;

      const activatorEvent = event.activatorEvent as PointerEvent | null;
      const delta = event.delta;
      const dropClientX = (activatorEvent?.clientX ?? 0) + delta.x;
      const trackDom = document.querySelector<HTMLElement>(
        `[data-track-id="${trackId}"]`,
      );
      let positionStart = useEditorStore.getState().playhead;
      if (trackDom) {
        const rect = trackDom.getBoundingClientRect();
        const xInLane = dropClientX - rect.left;
        positionStart = Math.max(0, pxToSeconds(xInLane, useEditorStore.getState().zoom));
      }

      const clip = createDefaultTextClip(trackId, positionStart, currentDoc);
      Object.assign(clip.style, preset.styleOverrides);
      clip.text = preset.label;
      addClip(trackId, clip);
    },
    [addClip],
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.kind === 'media-asset') {
      setActiveDragAsset(data.asset as MediaAsset);
    }
    if (data?.kind === 'text-preset') {
      setActiveDragLabel(data.preset.label as string);
    }
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragAsset(null);
      setActiveDragLabel(null);
      const data = event.active.data.current;
      if (!data) return;
      if (data.kind === 'media-asset') {
        handleDropAsset(data.asset as MediaAsset, event);
      }
      if (data.kind === 'text-preset') {
        handleDropTextPreset(data.preset as { id: string; label: string; styleOverrides: Record<string, unknown> }, event);
      }
    },
    [handleDropAsset, handleDropTextPreset],
  );

  const compositionProps = useMemo(() => ({ doc }), [doc]);

  const hasSelection = selection.clipIds.length > 0;
  const totalClips = doc.tracks.reduce((acc, t) => acc + t.clips.length, 0);

  const selectedClipForOverlay = useMemo(() => {
    const id = selection.clipIds[0];
    if (!id) return null;
    for (const track of doc.tracks) {
      const clip = track.clips.find((c) => c.id === id);
      if (clip && 'transform' in clip) return clip as typeof clip & { transform: import('@creo/video-player-data-access').Transform };
    }
    return null;
  }, [doc, selection.clipIds]);

  const handleCanvasTransformChange = useCallback(
    (patch: Partial<import('@creo/video-player-data-access').Transform>) => {
      const id = selection.clipIds[0];
      if (!id) return;
      updateClip(id, (c) => {
        if ('transform' in c) Object.assign(c.transform, patch);
      });
    },
    [selection.clipIds, updateClip],
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={styles.page} ref={pageRef}>
        <LeftSidebar />

        <div className={styles.main}>
          <div className={styles.playerWrapper}>
            <div className={styles.playerInner} ref={playerContainerRef}>
              <Player
                ref={playerRef}
                component={EditorComposition}
                inputProps={compositionProps}
                durationInFrames={durationInFrames}
                fps={doc.fps}
                compositionWidth={doc.resolution.width}
                compositionHeight={doc.resolution.height}
                loop
                className={styles.player}
                style={{ width: '100%', height: '100%' }}
              />
              <div className={styles.playerStatusOverlay}>
                <span>{`${totalClips} clips`}</span>
                <span>{`${duration.toFixed(1)}s`}</span>
                <span>{`${doc.resolution.width}×${doc.resolution.height}`}</span>
                <span>{`${doc.fps}fps`}</span>
                <span>{`${playhead.toFixed(2)}s`}</span>
              </div>
              {selectedClipForOverlay && (
                <TransformOverlay
                  clip={selectedClipForOverlay}
                  compositionSize={doc.resolution}
                  containerRef={playerContainerRef}
                  onChange={handleCanvasTransformChange}
                />
              )}
            </div>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.controlsLeft}>
              <Button
                type="primary"
                size="middle"
                title="Play / Pause (Space)"
                icon={<PlayCircleOutlined />}
                onClick={() => playerRef.current?.toggle()}
              />
              <div className={styles.toolSeparator} />
              <Button
                size="middle"
                title="Undo (Ctrl+Z)"
                icon={<UndoOutlined />}
                onClick={undo}
                disabled={past.length === 0}
              />
              <Button
                size="middle"
                title="Redo (Ctrl+Shift+Z)"
                icon={<RedoOutlined />}
                onClick={redo}
                disabled={future.length === 0}
              />
              <div className={styles.toolSeparator} />
              <Button
                size="middle"
                title="Split at playhead (S)"
                icon={<ScissorOutlined />}
                onClick={splitClipAtPlayhead}
                disabled={!hasSelection}
              />
              <Button
                size="middle"
                title="Delete selection (Del)"
                icon={<DeleteOutlined />}
                danger
                onClick={() => {
                  for (const id of selection.clipIds) removeClip(id);
                }}
                disabled={!hasSelection}
              />
            </div>
          </div>

          <Timeline />
        </div>

        <PropertiesPanel />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDragAsset && (
          <div className={styles.dragPreview}>
            <div className={styles.dragPreviewThumb}>
              {activeDragAsset.kind === 'video' && activeDragAsset.url ? (
                <video src={activeDragAsset.url} muted preload="metadata" />
              ) : activeDragAsset.kind === 'image' && activeDragAsset.url ? (
                <img src={activeDragAsset.url} alt="" />
              ) : (
                <CustomerServiceOutlined style={{ fontSize: 20, color: 'var(--creo-text-tertiary)' }} />
              )}
            </div>
            <span className={styles.dragPreviewName}>
              {activeDragAsset.originalName ?? 'Untitled'}
            </span>
          </div>
        )}
        {activeDragLabel && (
          <div className={styles.dragPreview}>
            <span className={styles.dragPreviewName}>Tt {activeDragLabel}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
