import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Public contract for the drag-and-drop context.  We expose only the pieces required
 * by the library table, the Now Playing sheet, and the sidebar playlists so we can
 * keep the implementation details hidden away in this module.
 */
interface DragContextType {
  draggedTrack: { id: string; title: string; artist?: { name: string } | null } | null;
  dragPosition: { x: number; y: number } | null;
  setDraggedTrack: (track: { id: string; title: string; artist?: { name: string } | null } | null) => void;
  setDragPosition: (position: { x: number; y: number } | null) => void;
  hoveredPlaylistId: string | null;
  setHoveredPlaylistId: (id: string | null) => void;
  lastHoveredPlaylistId: string | null;
  resetLastHoveredPlaylistId: () => void;
  registerDropZoneLayout: (id: string, layout: DropZoneLayout) => void;
  unregisterDropZoneLayout: (id: string) => void;
}

/**
 * Normalised geometry for a playlist drop target.  Coordinates are stored in
 * window-space so both native and web callers can contribute hit boxes.
 */
interface DropZoneLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedTrack, setDraggedTrack] = useState<{ id: string; title: string; artist?: { name: string } | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);
  const [lastHoveredPlaylistId, setLastHoveredPlaylistId] = useState<string | null>(null);
  const [dropZoneLayouts, setDropZoneLayouts] = useState<Record<string, DropZoneLayout>>({});

  /**
   * Register or update the layout for a playlist drop-zone.  Called from the sidebar
   * and any other surfaces that want to receive drops.
   */
  const registerDropZoneLayout = useCallback((id: string, layout: DropZoneLayout) => {
    setDropZoneLayouts((prev) => ({
      ...prev,
      [id]: layout,
    }));
  }, []);

  /**
   * Remove a drop-zone once the playlist unmounts to avoid using stale geometry.
   */
  const unregisterDropZoneLayout = useCallback((id: string) => {
    setDropZoneLayouts((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  /**
   * Resolve which playlist (if any) the pointer currently overlaps.  Web builds get
   * a fast DOM-based lookup while native uses the cached layout list.
   */
  useEffect(() => {
    if (!draggedTrack || !dragPosition) {
      console.log('[DragContext] No drag active; clearing hover');
      if (hoveredPlaylistId) {
        setHoveredPlaylistId(null);
      }
      return;
    }

    let nextHoveredId: string | null = null;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const element = document.elementFromPoint(dragPosition.x, dragPosition.y);
      console.log('[DragContext] elementFromPoint', dragPosition, element);
      if (element) {
        let current: HTMLElement | null = element as HTMLElement;

        while (current && !nextHoveredId) {
          const dataPlaylistId = current.getAttribute?.('data-playlist-id');
          const dataTestId = current.getAttribute?.('data-testid');
          const elementId = current.getAttribute?.('id');

          if (dataPlaylistId) {
            nextHoveredId = dataPlaylistId;
          } else if (dataTestId && dataTestId.startsWith('playlist-drop-')) {
            nextHoveredId = dataTestId.replace('playlist-drop-', '');
          } else if (elementId && elementId.startsWith('playlist-drop-')) {
            nextHoveredId = elementId.replace('playlist-drop-', '');
          } else {
            current = current.parentElement;
          }
        }
      }
    }

    if (!nextHoveredId) {
      Object.entries(dropZoneLayouts).forEach(([id, layout]) => {
        console.log('[DragContext] Checking layout', id, layout);
        if (!layout) return;
        const withinX = dragPosition.x >= layout.x && dragPosition.x <= layout.x + layout.width;
        const withinY = dragPosition.y >= layout.y && dragPosition.y <= layout.y + layout.height;

        if (withinX && withinY) {
          nextHoveredId = id;
        }
      });
    }

    if (nextHoveredId !== hoveredPlaylistId) {
      setHoveredPlaylistId(nextHoveredId);
      if (nextHoveredId) {
        setLastHoveredPlaylistId(nextHoveredId);
      }
      console.log('[DragContext] Hover changed to', nextHoveredId);
    }
  }, [dragPosition, draggedTrack, dropZoneLayouts, hoveredPlaylistId]);

  const resetLastHoveredPlaylistId = useCallback(() => {
    setLastHoveredPlaylistId(null);
  }, []);

  return (
    <DragContext.Provider
      value={{
        draggedTrack,
        dragPosition,
        setDraggedTrack,
        setDragPosition,
        hoveredPlaylistId,
        setHoveredPlaylistId,
        lastHoveredPlaylistId,
        resetLastHoveredPlaylistId,
        registerDropZoneLayout,
        unregisterDropZoneLayout,
      }}
    >
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
}

