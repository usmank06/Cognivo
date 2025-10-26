import { useState } from 'react';
import { ChatSidebar } from './board/ChatSidebar';
import { BoardSidebar } from './board/BoardSidebar';
import { CanvasArea } from './board/CanvasArea';

export type BoardType = 'canvas' | 'pdf';

export interface Board {
  id: string;
  name: string;
  type: BoardType;
  lastEdited: Date;
}

export function BoardPage() {
  const [boards, setBoards] = useState<Board[]>([
    { id: '1', name: 'Marketing Dashboard', type: 'canvas', lastEdited: new Date('2025-10-10') },
    { id: '2', name: 'Q4 Report', type: 'pdf', lastEdited: new Date('2025-10-09') },
  ]);
  const [currentBoard, setCurrentBoard] = useState<Board>(boards[0]);
  const [viewMode, setViewMode] = useState<'canvas' | 'code'>('canvas');

  const handleCreateBoard = (name: string, type: BoardType) => {
    const newBoard: Board = {
      id: Date.now().toString(),
      name,
      type,
      lastEdited: new Date(),
    };
    setBoards([newBoard, ...boards]);
    setCurrentBoard(newBoard);
  };

  const handleEditBoard = (id: string, name: string) => {
    setBoards(boards.map(b => b.id === id ? { ...b, name, lastEdited: new Date() } : b));
    if (currentBoard.id === id) {
      setCurrentBoard({ ...currentBoard, name });
    }
  };

  const handleDeleteBoard = (id: string) => {
    const updatedBoards = boards.filter(b => b.id !== id);
    setBoards(updatedBoards);
    if (currentBoard.id === id && updatedBoards.length > 0) {
      setCurrentBoard(updatedBoards[0]);
    }
  };

  return (
    <div className="h-screen pt-16 flex overflow-hidden bg-background">
      <ChatSidebar />
      
      <div className="flex-1 relative">
        <CanvasArea 
          board={currentBoard}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      <BoardSidebar
        boards={boards}
        currentBoard={currentBoard}
        onSelectBoard={setCurrentBoard}
        onCreateBoard={handleCreateBoard}
        onEditBoard={handleEditBoard}
        onDeleteBoard={handleDeleteBoard}
      />
    </div>
  );
}
