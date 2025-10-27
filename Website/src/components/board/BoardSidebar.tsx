import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, Edit2, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import type { Canvas } from '../BoardPage';

interface BoardSidebarProps {
  canvases: Canvas[];
  currentCanvas: Canvas | null;
  onSelectCanvas: (canvas: Canvas) => void;
  onCreateCanvas: (name: string) => void;
  onRenameCanvas: (id: string, name: string) => void;
  onDeleteCanvas: (id: string) => void;
}

export function BoardSidebar({ 
  canvases, 
  currentCanvas, 
  onSelectCanvas, 
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas 
}: BoardSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCanvas, setEditingCanvas] = useState<Canvas | null>(null);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [editCanvasName, setEditCanvasName] = useState('');

  const handleCreateCanvas = () => {
    if (newCanvasName.trim()) {
      onCreateCanvas(newCanvasName);
      setNewCanvasName('');
      setIsCreateOpen(false);
    }
  };

  const handleEditCanvas = () => {
    if (editingCanvas && editCanvasName.trim()) {
      onRenameCanvas(editingCanvas.id, editCanvasName);
      setEditCanvasName('');
      setEditingCanvas(null);
      setIsEditOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  return (
    <>
      <div 
        className={`
          bg-card border-l border-border transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-80' : 'w-12'}
          flex flex-col
        `}
      >
        <div className="h-full flex flex-col">
          {isExpanded ? (
            <>
              <div className="p-4 border-b border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">Canvases</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      New Canvas
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Canvas</DialogTitle>
                      <DialogDescription>
                        Choose a name for your new canvas
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="canvas-name">Canvas Name</Label>
                        <Input
                          id="canvas-name"
                          placeholder="Enter canvas name"
                          value={newCanvasName}
                          onChange={(e) => setNewCanvasName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateCanvas();
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateCanvas}>
                        Create Canvas
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {canvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      className={`
                        rounded-lg border transition-colors cursor-pointer overflow-hidden
                        ${currentCanvas?.id === canvas.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                      `}
                      onClick={() => onSelectCanvas(canvas)}
                    >
                      {/* Thumbnail */}
                      <div className="w-full h-32 bg-slate-900 flex items-center justify-center border-b border-border">
                        {canvas.thumbnail ? (
                          <img 
                            src={canvas.thumbnail} 
                            alt={canvas.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <FileText className="h-8 w-8" />
                            <span className="text-xs">No preview</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Canvas Info */}
                      <div className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium truncate pr-2">{canvas.name}</h4>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCanvas(canvas);
                                setEditCanvasName(canvas.name);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canvases.length > 1 || window.confirm('Delete this canvas?')) {
                                  onDeleteCanvas(canvas.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-xs">
                            {canvas.chatCount || 0} chats
                          </Badge>
                          <span className="text-muted-foreground">
                            {formatDate(canvas.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-12 w-12 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Canvas</DialogTitle>
            <DialogDescription>
              Update your canvas name
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-canvas-name">Canvas Name</Label>
              <Input
                id="edit-canvas-name"
                placeholder="Enter canvas name"
                value={editCanvasName}
                onChange={(e) => setEditCanvasName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditCanvas();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCanvas}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
