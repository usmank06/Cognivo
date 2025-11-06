import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, Edit2, Trash2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import type { Canvas } from '../CanvasPage';

interface CanvasSidebarProps {
  canvases: Canvas[];
  currentCanvas: Canvas | null;
  onSelectCanvas: (canvas: Canvas) => void;
  onCreateCanvas: (name: string) => void;
  onRenameCanvas: (id: string, name: string) => void;
  onDeleteCanvas: (id: string) => void;
}

export function CanvasSidebar({ 
  canvases, 
  currentCanvas, 
  onSelectCanvas, 
  onCreateCanvas,
  onRenameCanvas,
  onDeleteCanvas 
}: CanvasSidebarProps) {
  // Load saved state from localStorage
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('canvasSidebar-expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [editingCanvas, setEditingCanvas] = useState<Canvas | null>(null);
  const [deletingCanvas, setDeletingCanvas] = useState<Canvas | null>(null);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [editCanvasName, setEditCanvasName] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Save expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('canvasSidebar-expanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

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
    <div className="relative h-full">
      {/* Collapse/Expand Tab - always visible on canvas side */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-16 bg-background border border-l-0 border-border rounded-r-lg flex items-center justify-center hover:bg-secondary/50 transition-colors shadow-sm z-20"
        style={{
          right: isExpanded ? '320px' : '0px',
          transition: 'right 0.3s ease-in-out'
        }}
      >
        {isExpanded ? (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      <div 
        ref={sidebarRef}
        className="bg-background border-l border-border shadow-sm flex flex-col relative h-full"
        style={{ 
          width: isExpanded ? '320px' : '0px',
          transition: 'width 0.3s ease-in-out'
        }}
      >

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {isExpanded && (
            <>
              <div className="p-4 border-b border-border space-y-3">
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
              
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3 pb-16">
                    {canvases.map((canvas) => (
                    <div
                      key={canvas.id}
                      className={`
                        rounded-xl border-2 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-md
                        ${currentCanvas?.id === canvas.id 
                          ? 'border-primary bg-secondary/30 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-secondary/20'}
                      `}
                      onClick={() => onSelectCanvas(canvas)}
                    >
                      {/* Canvas Info */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium truncate pr-2">{canvas.name}</h4>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e: React.MouseEvent) => {
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
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setDeletingCanvas(canvas);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className="text-xs">
                            {(() => {
                              try {
                                if (!canvas.script) {
                                  return '0 elements';
                                }
                                const script = JSON.parse(canvas.script);
                                const nodeCount = script.nodes?.length || 0;
                                return `${nodeCount} element${nodeCount !== 1 ? 's' : ''}`;
                              } catch (error) {
                                console.warn('Failed to parse canvas script for element count:', canvas.id);
                                return '0 elements';
                              }
                            })()}
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
              </div>
            </>
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

      {/* Delete Canvas Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Canvas</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCanvas?.name}"? This will move it to deleted canvases. You can't undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingCanvas) {
                  onDeleteCanvas(deletingCanvas.id);
                  setDeletingCanvas(null);
                  setIsDeleteOpen(false);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
