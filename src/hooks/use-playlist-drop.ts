import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useDrag, DraggedTrack } from '@/src/contexts/drag-context';

interface UsePlaylistDropOptions {
  onDrop: (args: { track: DraggedTrack; playlistId: string; event?: any }) => Promise<void> | void;
}

export function usePlaylistDrop(playlistId: string, options: UsePlaylistDropOptions) {
  const { onDrop } = options;
  const { draggedTrack, hoveredPlaylistId, setHoveredPlaylistId, endDrag } = useDrag();

  const isHovered = !!draggedTrack && hoveredPlaylistId === playlistId;
  const canDrop = !!draggedTrack;

  const resolveTrackFromEvent = useCallback(
    (event: any): DraggedTrack | null => {
      if (!draggedTrack) {
        return null;
      }

      if (Platform.OS === 'web' && event?.dataTransfer) {
        try {
          const payload = event.dataTransfer.getData('application/json');
          if (payload) {
            const parsed = JSON.parse(payload);
            if (parsed && typeof parsed === 'object' && parsed.id) {
              return {
                ...draggedTrack,
                ...parsed,
              };
            }
          }
        } catch (error) {
          console.warn('Failed to parse drag payload, falling back to context track', error);
        }
      }

      return draggedTrack;
    },
    [draggedTrack],
  );

  const performDrop = useCallback(
    async (event?: any) => {
      if (!draggedTrack) {
        return;
      }

      const track = resolveTrackFromEvent(event);
      if (!track) {
        return;
      }

      await onDrop({ track, playlistId, event });
      endDrag();
    },
    [draggedTrack, endDrag, onDrop, playlistId, resolveTrackFromEvent],
  );

  const handleDragOver = useCallback(
    (event: any) => {
      if (!draggedTrack) {
        return;
      }

      if (Platform.OS === 'web') {
        event.preventDefault();
        event.stopPropagation();
        if (event.dataTransfer) {
          event.dataTransfer.dropEffect = 'move';
        }
      }

      if (hoveredPlaylistId !== playlistId) {
        setHoveredPlaylistId(playlistId);
      }
    },
    [draggedTrack, hoveredPlaylistId, playlistId, setHoveredPlaylistId],
  );

  const handleDragLeave = useCallback(
    (event: any) => {
      if (Platform.OS === 'web') {
        const relatedTarget = event?.relatedTarget;
        const currentTarget = event?.currentTarget;
        if (currentTarget && relatedTarget && currentTarget.contains?.(relatedTarget)) {
          return;
        }
        event.stopPropagation?.();
      }

      if (hoveredPlaylistId === playlistId) {
        setHoveredPlaylistId(null);
      }
    },
    [hoveredPlaylistId, playlistId, setHoveredPlaylistId],
  );

  const dropTargetProps = useMemo(() => {
    if (Platform.OS !== 'web') {
      return {};
    }

    return {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        performDrop(event);
      },
    } as const;
  }, [handleDragLeave, handleDragOver, performDrop]);

  return {
    canDrop,
    isHovered,
    dropTargetProps,
    performDrop,
  } as const;
}
