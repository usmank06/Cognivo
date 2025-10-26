import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Badge } from '../ui/badge';
import type { Board, BoardType } from '../BoardPage';

interface BoardSidebarProps {
  boards: Board[];
  currentBoard: Board;
  onSelectBoard: (board: Board) => void;
  onCreateBoard: (name: string, type: BoardType) => void;
  onEditBoard: (id: string, name: string) => void;
  onDeleteBoard: (id: string) => void;
}

export function BoardSidebar({ 
  boards, 
  currentBoard, 
  onSelectBoard, 
  onCreateBoard,
  onEditBoard,
  onDeleteBoard 
}: BoardSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardType, setNewBoardType] = useState<BoardType>('canvas');
  const [editBoardName, setEditBoardName] = useState('');

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName, newBoardType);
      setNewBoardName('');
      setNewBoardType('canvas');
      setIsCreateOpen(false);
    }
  };

  const handleEditBoard = () => {
    if (editingBoard && editBoardName.trim()) {
      onEditBoard(editingBoard.id, editBoardName);
      setEditBoardName('');
      setEditingBoard(null);
      setIsEditOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
                    <span className="text-sm">Boards</span>
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
                <Select 
                  value={currentBoard.id} 
                  onValueChange={(id) => {
                    const board = boards.find(b => b.id === id);
                    if (board) onSelectBoard(board);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.id}>
                        {board.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      New Board
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Board</DialogTitle>
                      <DialogDescription>
                        Choose a name and type for your new board
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="board-name">Board Name</Label>
                        <Input
                          id="board-name"
                          placeholder="Enter board name"
                          value={newBoardName}
                          onChange={(e) => setNewBoardName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Board Type</Label>
                        <RadioGroup value={newBoardType} onValueChange={(v) => setNewBoardType(v as BoardType)}>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="canvas" id="canvas" />
                            <Label htmlFor="canvas">Infinite Canvas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="pdf" id="pdf" />
                            <Label htmlFor="pdf">PDF Report</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBoard}>
                        Create Board
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className={`
                        p-4 rounded-lg border transition-colors cursor-pointer
                        ${currentBoard.id === board.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'}
                      `}
                      onClick={() => onSelectBoard(board)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-sm">{board.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBoard(board);
                              setEditBoardName(board.name);
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
                              if (boards.length > 1) {
                                onDeleteBoard(board.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {board.type === 'canvas' ? 'Canvas' : 'PDF'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(board.lastEdited)}
                        </span>
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
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Update your board details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-board-name">Board Name</Label>
              <Input
                id="edit-board-name"
                placeholder="Enter board name"
                value={editBoardName}
                onChange={(e) => setEditBoardName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBoard}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
