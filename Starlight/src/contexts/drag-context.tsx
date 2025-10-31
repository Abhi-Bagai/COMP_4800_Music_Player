import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DragContextType {
  draggedTrack: { id: string; title: string; artist?: { name: string } | null } | null;
  dragPosition: { x: number; y: number } | null;
  setDraggedTrack: (track: { id: string; title: string; artist?: { name: string } | null } | null) => void;
  setDragPosition: (position: { x: number; y: number } | null) => void;
  hoveredPlaylistId: string | null;
  setHoveredPlaylistId: (id: string | null) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedTrack, setDraggedTrack] = useState<{ id: string; title: string; artist?: { name: string } | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);

  return (
    <DragContext.Provider
      value={{
        draggedTrack,
        dragPosition,
        setDraggedTrack,
        setDragPosition,
        hoveredPlaylistId,
        setHoveredPlaylistId,
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

