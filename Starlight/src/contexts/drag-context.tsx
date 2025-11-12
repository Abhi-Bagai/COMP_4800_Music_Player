import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

interface DragContextType {
  draggedTrack: { id: string; title: string; artist?: { name: string } | null } | null;
  dragPosition: { x: number; y: number } | null;
  setDraggedTrack: (track: { id: string; title: string; artist?: { name: string } | null } | null) => void;
  setDragPosition: (position: { x: number; y: number } | null) => void;
  hoveredPlaylistId: string | null;
  setHoveredPlaylistId: (id: string | null) => void;
  registerDropZoneLayout: (id: string, layout: DropZoneLayout) => void;
  unregisterDropZoneLayout: (id: string) => void;
}

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
  const [dropZoneLayouts, setDropZoneLayouts] = useState<Record<string, DropZoneLayout>>({});

  const registerDropZoneLayout = useCallback((id: string, layout: DropZoneLayout) => {
    setDropZoneLayouts((prev) => ({
      ...prev,
      [id]: layout,
    }));
  }, []);

  const unregisterDropZoneLayout = useCallback((id: string) => {
    setDropZoneLayouts((prev) => {
      if (!prev[id]) return prev;
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  }, []);

  useEffect(() => {
    if (!draggedTrack || !dragPosition) {
      if (hoveredPlaylistId) {
        setHoveredPlaylistId(null);
      }
      return;
    }

    let nextHoveredId: string | null = null;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const element = document.elementFromPoint(dragPosition.x, dragPosition.y);
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
    }
  }, [dragPosition, draggedTrack, dropZoneLayouts, hoveredPlaylistId, setHoveredPlaylistId]);

  return (
    <DragContext.Provider
      value={{
        draggedTrack,
        dragPosition,
        setDraggedTrack,
        setDragPosition,
        hoveredPlaylistId,
        setHoveredPlaylistId,
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

