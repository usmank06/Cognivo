import { useState, useEffect, useCallback } from 'react';
import { ChatSidebar } from './board/ChatSidebar';
import { CanvasSidebar } from './board/CanvasSidebar';
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

interface CanvasPageProps {
  username: string;
  userId: string;
}

export function CanvasPage({ username, userId }: CanvasPageProps) {
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
      console.log('📚 [CANVAS PAGE] Loading all canvases...');
      const response = await fetch(`http://localhost:3001/api/canvas/${username}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [CANVAS PAGE] Loaded', data.canvases.length, 'canvases');
        data.canvases.forEach((c: any) => {
          console.log('  📋 Canvas', c.name, '- chats:', c.chats?.length || 0);
        });
        setCanvases(data.canvases);
        // If no current canvas and canvases exist, select the first one
        if (!currentCanvas && data.canvases.length > 0) {
          console.log('🎯 [CANVAS PAGE] Auto-selecting first canvas');
          setCurrentCanvas(data.canvases[0]);
        } else if (data.canvases.length === 0) {
          console.log('🆕 [CANVAS PAGE] No canvases found, creating default');
          // Create a default canvas if none exist
          handleCreateCanvas('My First Canvas');
        }
      } else {
        console.error('❌ [CANVAS PAGE] Failed to load canvases:', data.error);
      }
    } catch (error) {
      console.error('❌ [CANVAS PAGE] Error loading canvases:', error);
      toast.error('Failed to load canvases');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCanvasDetails = async (canvasId: string) => {
    try {
      console.log('📥 [CANVAS PAGE] Loading canvas details for:', canvasId);
      const response = await fetch(`http://localhost:3001/api/canvas/${username}/${canvasId}`);
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [CANVAS PAGE] Loaded canvas with', data.canvas.chats?.length || 0, 'chats');
        console.log('📋 [CANVAS PAGE] Chat IDs:', data.canvas.chats?.map((c: any) => c.id) || []);
        setCanvasScript(data.canvas.script);
        // Update current canvas with full data
        setCurrentCanvas(prev => ({
          ...prev!,
          script: data.canvas.script,
          chats: data.canvas.chats,
        }));
      } else {
        console.error('❌ [CANVAS PAGE] Failed to load canvas:', data.error);
      }
    } catch (error) {
      console.error('❌ [CANVAS PAGE] Error loading canvas details:', error);
      toast.error('Failed to load canvas');
    }
  };

  const handleCreateCanvas = async (name: string) => {
    try {
      console.log('🆕 [CANVAS PAGE] Creating new canvas:', name);
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
        console.log('✅ [CANVAS PAGE] Canvas created with ID:', data.canvasId);
        console.log('📊 [CANVAS PAGE] Canvas has', data.canvas.chats?.length || 0, 'chats');
        console.log('📋 [CANVAS PAGE] Chat IDs:', data.canvas.chats?.map((c: any) => c.id) || []);
        toast.success('Canvas created!');
        await loadCanvases();
        // Select the newly created canvas
        const newCanvas: Canvas = {
          id: data.canvasId,
          name: data.canvas.name,
          createdAt: data.canvas.createdAt,
          updatedAt: data.canvas.updatedAt,
          lastAccessedAt: new Date(),
          chatCount: data.canvas.chats?.length || 0,
          script: data.canvas.script,
          chats: data.canvas.chats || [],
        };
        console.log('📝 [CANVAS PAGE] Setting current canvas with', newCanvas.chats?.length || 0, 'chats');
        setCurrentCanvas(newCanvas);
      } else {
        console.error('❌ [CANVAS PAGE] Failed to create canvas:', data.error);
      }
    } catch (error) {
      console.error('❌ [CANVAS PAGE] Error creating canvas:', error);
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
    console.log('🎯 [CANVAS PAGE] Selecting canvas:', canvas.id);
    console.log('📊 [CANVAS PAGE] Canvas has', canvas.chats?.length || 0, 'chats loaded in state');
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
    <div className="h-screen pt-16 flex overflow-hidden bg-background relative">
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

      <CanvasSidebar
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
