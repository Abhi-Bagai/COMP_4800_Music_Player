import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DragContextType {
  draggedTrack: { id: string; title: string; artist?: { name: string } | null } | null;
  dragPosition: { x: number; y: number } | null;
  setDraggedTrack: React.Dispatch<React.SetStateAction<{ id: string; title: string; artist?: { name: string } | null } | null>>;
  setDragPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  hoveredTargetId: string | null;
  setHoveredTargetId: React.Dispatch<React.SetStateAction<string | null>>;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedTrack, setDraggedTrack] = useState<{ id: string; title: string; artist?: { name: string } | null } | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<string | null>(null);

  return (
    <DragContext.Provider
      value={{
        draggedTrack,
        dragPosition,
        setDraggedTrack,
        setDragPosition,
        hoveredTargetId,
        setHoveredTargetId,
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

