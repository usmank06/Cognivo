import { useState, useEffect, useCallback } from 'react';
import { ChatSidebar } from './board/ChatSidebar';
import { BoardSidebar } from './board/BoardSidebar';
import { CanvasArea } from './board/CanvasArea';
import { toast } from 'sonner';

export interface Canvas {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
  chatCount: number;
  script?: string;
  chats?: any[];
}

interface BoardPageProps {
  username: string;
  userId: string;
}

export function BoardPage({ username, userId }: BoardPageProps) {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [currentCanvas, setCurrentCanvas] = useState<Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [canvasScript, setCanvasScript] = useState<string>('{"nodes":[],"edges":[]}');

  // Load all canvases on mount
  useEffect(() => {
    loadCanvases();
  }, [username]);

  // Load current canvas details when selected
  useEffect(() => {
    if (currentCanvas) {
      loadCanvasDetails(currentCanvas.id);
    }
  }, [currentCanvas?.id]);

  const loadCanvases = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/canvas/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setCanvases(data.canvases);
        // If no current canvas and canvases exist, select the first one
        if (!currentCanvas && data.canvases.length > 0) {
          setCurrentCanvas(data.canvases[0]);
        } else if (data.canvases.length === 0) {
          // Create a default canvas if none exist
          handleCreateCanvas('My First Canvas');
        }
      }
    } catch (error) {
      console.error('Failed to load canvases:', error);
      toast.error('Failed to load canvases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCanvasDetails = async (canvasId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/canvas/${username}/${canvasId}`);
      const data = await response.json();
      
      if (data.success) {
        setCanvasScript(data.canvas.script);
        // Update current canvas with full data
        setCurrentCanvas(prev => ({
          ...prev!,
          script: data.canvas.script,
          chats: data.canvas.chats,
        }));
      }
    } catch (error) {
      console.error('Failed to load canvas details:', error);
      toast.error('Failed to load canvas');
    }
  };

  const handleCreateCanvas = async (name: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/canvas/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          userId, 
          name,
          initialScript: '{"nodes":[],"edges":[]}',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canvas created!');
        await loadCanvases();
        // Select the newly created canvas
        const newCanvas: Canvas = {
          id: data.canvasId,
          name: data.canvas.name,
          createdAt: data.canvas.createdAt,
          updatedAt: data.canvas.updatedAt,
          lastAccessedAt: new Date(),
          chatCount: 0,
          script: data.canvas.script,
          chats: [],
        };
        setCurrentCanvas(newCanvas);
      }
    } catch (error) {
      console.error('Create canvas error:', error);
      toast.error('Failed to create canvas');
    }
  };

  const handleRenameCanvas = async (id: string, name: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/canvas/${username}/${id}/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canvas renamed!');
        setCanvases(canvases.map(c => c.id === id ? { ...c, name } : c));
        if (currentCanvas?.id === id) {
          setCurrentCanvas({ ...currentCanvas, name });
        }
      }
    } catch (error) {
      console.error('Rename canvas error:', error);
      toast.error('Failed to rename canvas');
    }
  };

  const handleDeleteCanvas = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/canvas/${username}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Canvas deleted');
        const updatedCanvases = canvases.filter(c => c.id !== id);
        setCanvases(updatedCanvases);
        
        // If deleted canvas was current, switch to another
        if (currentCanvas?.id === id) {
          if (updatedCanvases.length > 0) {
            setCurrentCanvas(updatedCanvases[0]);
          } else {
            setCurrentCanvas(null);
            // Create a new default canvas
            handleCreateCanvas('My Canvas');
          }
        }
      }
    } catch (error) {
      console.error('Delete canvas error:', error);
      toast.error('Failed to delete canvas');
    }
  };

  const handleScriptChange = (newScript: string) => {
    setCanvasScript(newScript);
  };

  const handleSelectCanvas = (canvas: Canvas) => {
    setCurrentCanvas(canvas);
  };

  // Function to reload canvas (for chat to call after DB update)
  const reloadCanvas = useCallback(async () => {
    if (currentCanvas) {
      await loadCanvasDetails(currentCanvas.id);
    }
  }, [currentCanvas?.id, username]);

  if (isLoading) {
    return (
      <div className="h-screen pt-16 flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading canvases...</div>
      </div>
    );
  }

  return (
    <div className="h-screen pt-16 flex overflow-hidden bg-background">
      <ChatSidebar 
        currentCanvas={currentCanvas}
        username={username}
        onReloadCanvas={reloadCanvas}
      />
      
      <div className="flex-1 relative">
        {currentCanvas ? (
          <CanvasArea 
            canvas={currentCanvas}
            username={username}
            script={canvasScript}
            onScriptChange={handleScriptChange}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No canvas selected</p>
            </div>
          </div>
        )}
      </div>

      <BoardSidebar
        canvases={canvases}
        currentCanvas={currentCanvas}
        onSelectCanvas={handleSelectCanvas}
        onCreateCanvas={handleCreateCanvas}
        onRenameCanvas={handleRenameCanvas}
        onDeleteCanvas={handleDeleteCanvas}
      />
    </div>
  );
}
