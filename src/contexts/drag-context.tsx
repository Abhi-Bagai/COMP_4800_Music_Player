import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export interface DraggedTrack {
  id: string;
  title: string;
  artist?: { name: string } | null;
}

export interface DragPosition {
  x: number;
  y: number;
}

interface DragContextType {
  draggedTrack: DraggedTrack | null;
  dragPosition: DragPosition | null;
  hoveredPlaylistId: string | null;
  startDrag: (track: DraggedTrack, position?: DragPosition | null) => void;
  updateDragPosition: (position: DragPosition | null) => void;
  endDrag: () => void;
  setHoveredPlaylistId: (id: string | null) => void;
}

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [draggedTrack, setDraggedTrack] = useState<DraggedTrack | null>(null);
  const [dragPosition, setDragPosition] = useState<DragPosition | null>(null);
  const [hoveredPlaylistId, setHoveredPlaylistId] = useState<string | null>(null);

  const startDrag = useCallback(
    (track: DraggedTrack, position: DragPosition | null = null) => {
      setDraggedTrack(track);
      setDragPosition(position);
    },
    [],
  );

  const updateDragPosition = useCallback((position: DragPosition | null) => {
    setDragPosition(position);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedTrack(null);
    setDragPosition(null);
    setHoveredPlaylistId(null);
  }, []);

  const value = useMemo(
    () => ({
      draggedTrack,
      dragPosition,
      hoveredPlaylistId,
      startDrag,
      updateDragPosition,
      endDrag,
      setHoveredPlaylistId,
    }),
    [draggedTrack, dragPosition, hoveredPlaylistId, startDrag, updateDragPosition, endDrag],
  );

  return <DragContext.Provider value={value}>{children}</DragContext.Provider>;
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
}
