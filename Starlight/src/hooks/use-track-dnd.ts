import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useDrag } from '@/src/contexts/drag-context';

export interface DraggedTrack {
  id: string;
  title: string;
  artist?: { name: string } | null;
}

export function useTrackDragSource(track: DraggedTrack) {
  const { setDraggedTrack, setDragPosition } = useDrag();

  const trackSummary = useMemo(
    () => ({
      id: track.id,
      title: track.title,
      artist: track.artist ?? null,
    }),
    [track.artist, track.id, track.title]
  );

  const startDrag = useCallback(
    (pageX: number, pageY: number) => {
      setDraggedTrack(trackSummary);
      setDragPosition({ x: pageX, y: pageY });
    },
    [setDraggedTrack, setDragPosition, trackSummary]
  );

  const updateDragPosition = useCallback(
    (pageX: number, pageY: number) => {
      setDragPosition({ x: pageX, y: pageY });
    },
    [setDragPosition]
  );

  const endDrag = useCallback(() => {
    setDraggedTrack(null);
    setDragPosition(null);
  }, [setDraggedTrack, setDragPosition]);

  const applyWebDataTransfer = useCallback(
    (event: any) => {
      if (Platform.OS !== 'web' || !event?.dataTransfer) return;

      try {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify(trackSummary));
      } catch (error) {
        console.warn('Failed to attach drag data', error);
      }
    },
    [trackSummary]
  );

  return {
    startDrag,
    updateDragPosition,
    endDrag,
    applyWebDataTransfer,
    track: trackSummary,
  };
}

interface UseTrackDropTargetOptions {
  targetId?: string | null;
  onDropTrack: (track: DraggedTrack) => Promise<void> | void;
  isEnabled?: boolean;
}

export function useTrackDropTarget({
  targetId,
  onDropTrack,
  isEnabled = true,
}: UseTrackDropTargetOptions) {
  const {
    draggedTrack,
    hoveredTargetId,
    setHoveredTargetId,
    setDraggedTrack,
    setDragPosition,
  } = useDrag();

  const enabled = Boolean(isEnabled && targetId);

  const handleDrop = useCallback(
    async (event?: any) => {
      if (!enabled || !draggedTrack) return;

      if (event && Platform.OS === 'web') {
        event.preventDefault?.();
        event.stopPropagation?.();
      }

      let trackData = draggedTrack;

      if (Platform.OS === 'web' && event?.dataTransfer) {
        try {
          const payload = event.dataTransfer.getData('application/json');
          if (payload) {
            trackData = JSON.parse(payload);
          }
        } catch (error) {
          console.warn('Failed to parse drag payload, falling back to context', error);
        }
      }

      if (!trackData) return;

      await onDropTrack(trackData);
      setHoveredTargetId(null);
      setDraggedTrack(null);
      setDragPosition(null);
    },
    [
      draggedTrack,
      enabled,
      onDropTrack,
      setDragPosition,
      setDraggedTrack,
      setHoveredTargetId,
    ]
  );

  const handleDragOver = useCallback(
    (event: any) => {
      if (!enabled || Platform.OS !== 'web' || !draggedTrack) return;

      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
      }

      setHoveredTargetId((current) => (current === targetId ? current : targetId ?? null));
    },
    [draggedTrack, enabled, setHoveredTargetId, targetId]
  );

  const handleDragLeave = useCallback(
    (event: any) => {
      if (!enabled || Platform.OS !== 'web') return;

      const relatedTarget = event?.relatedTarget;
      const currentTarget = event?.currentTarget;

      if (!currentTarget || !currentTarget.contains || !currentTarget.contains(relatedTarget)) {
        setHoveredTargetId((current) => (current === targetId ? null : current));
      }
    },
    [enabled, setHoveredTargetId, targetId]
  );

  const webDropHandlers =
    Platform.OS === 'web' && enabled
      ? {
          onDragOver: handleDragOver,
          onDrop: handleDrop,
          onDragLeave: handleDragLeave,
        }
      : {};

  const isHovered = enabled && hoveredTargetId === targetId && !!draggedTrack;

  return {
    draggedTrack,
    isHovered,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    webDropHandlers,
  };
}
