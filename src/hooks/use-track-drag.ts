import { useCallback, useMemo } from 'react';
import { Platform } from 'react-native';

import { useDrag, DraggedTrack, DragPosition } from '@/src/contexts/drag-context';

type DragEventInput = {
  pageX?: number;
  pageY?: number;
  locationX?: number;
  locationY?: number;
} | null;

interface UseTrackDragOptions {
  onDragStart?: () => void;
  onDragEnd?: () => void;
  getDragData?: () => unknown;
}

const defaultPosition: DragPosition = { x: 0, y: 0 };

function extractPosition(event?: DragEventInput): DragPosition {
  if (!event) {
    return defaultPosition;
  }

  const x = event.pageX ?? event.locationX ?? defaultPosition.x;
  const y = event.pageY ?? event.locationY ?? defaultPosition.y;

  return { x, y };
}

export function useTrackDrag(track: DraggedTrack, options: UseTrackDragOptions = {}) {
  const { onDragStart, onDragEnd, getDragData } = options;
  const { startDrag, updateDragPosition, endDrag } = useDrag();

  const beginDrag = useCallback(
    (event?: DragEventInput) => {
      onDragStart?.();
      startDrag(track, extractPosition(event));
    },
    [onDragStart, startDrag, track],
  );

  const moveDrag = useCallback(
    (event?: DragEventInput) => {
      if (!event) {
        return;
      }
      updateDragPosition(extractPosition(event));
    },
    [updateDragPosition],
  );

  const finishDrag = useCallback(() => {
    endDrag();
    onDragEnd?.();
  }, [endDrag, onDragEnd]);

  const webDragProps = useMemo(() => {
    if (Platform.OS !== 'web') {
      return {};
    }

    return {
      draggable: true,
      onDragStart: (event: any) => {
        beginDrag(event);
        if (event.dataTransfer) {
          event.dataTransfer.effectAllowed = 'move';
          const payload = getDragData?.() ?? track;
          try {
            event.dataTransfer.setData('application/json', JSON.stringify(payload));
          } catch (error) {
            console.warn('Failed to serialise drag payload', error);
          }
        }
      },
      onDrag: (event: any) => {
        moveDrag(event);
      },
      onDragEnd: () => {
        finishDrag();
      },
    } as const;
  }, [beginDrag, finishDrag, getDragData, moveDrag, track]);

  return {
    beginDrag,
    moveDrag,
    finishDrag,
    webDragProps,
  } as const;
}
