import { useState, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Eye, 
  Code, 
  MoreVertical,
  Download,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  Save,
  Crosshair
} from 'lucide-react';
import { Button } from '../../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../../ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import { cn } from '../../ui/utils';

interface FloatingCanvasToolbarProps {
  // View mode
  viewMode: 'graph' | 'code';
  onViewModeChange: (mode: 'graph' | 'code') => void;
  
  // Zoom controls (for graph view)
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  
  // Export options
  onExportPNG?: () => void;
  onExportPDF?: () => void;
  onExportJSON?: () => void;
  
  // Save functionality
  onSave?: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
  
  // Format JSON (for code view)
  onFormatJSON?: () => void;
  
  // Optional: current zoom level for display
  zoomLevel?: number;
}

export function FloatingCanvasToolbar({
  viewMode,
  onViewModeChange,
  onZoomIn,
  onZoomOut,
  onFitView,
  onExportPNG,
  onExportPDF,
  onExportJSON,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false,
  onFormatJSON,
  zoomLevel = 100,
}: FloatingCanvasToolbarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSaveStatus, setShowSaveStatus] = useState(false);

  // Show save status briefly when saving completes
  useEffect(() => {
    if (!isSaving && !hasUnsavedChanges) {
      setShowSaveStatus(true);
      const timer = setTimeout(() => setShowSaveStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSaving, hasUnsavedChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + = for zoom in
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        onZoomIn?.();
      }
      // Ctrl/Cmd + - for zoom out
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        onZoomOut?.();
      }
      // Ctrl/Cmd + 0 for fit view
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onFitView?.();
      }
      // Ctrl/Cmd + E for export menu (just log for now)
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        // Could open export dropdown programmatically
      }
      // Ctrl/Cmd + S for save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onZoomIn, onZoomOut, onFitView, onSave]);

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "absolute top-4 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-1",
          "bg-white",
          "border-2 border-border rounded-full shadow-lg",
          "px-4 py-3",
          "transition-all duration-200",
          "pointer-events-auto",
          isHovered && "shadow-xl border-primary/20"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* View Mode Toggle */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'graph' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('graph')}
                className={cn(
                  "h-9 w-9 p-0 rounded-full",
                  viewMode === 'graph' && "bg-primary text-primary-foreground"
                )}
              >
                <Eye className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Graph View</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('code')}
                className={cn(
                  "h-9 w-9 p-0 rounded-full",
                  viewMode === 'code' && "bg-primary text-primary-foreground"
                )}
              >
                <Code className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Code View</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Graph View Controls */}
        {viewMode === 'graph' && (
          <div className="flex items-center gap-0.5 px-2 border-r border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Zoom Out button clicked');
                    if (onZoomOut) {
                      onZoomOut();
                    }
                  }}
                  className="h-9 w-9 p-0 rounded-full"
                  type="button"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Zoom Out (Ctrl + -)</p>
              </TooltipContent>
            </Tooltip>

            <div className="px-2 min-w-[48px] text-center">
              <span className="text-sm font-medium text-muted-foreground">
                {Math.round(zoomLevel)}%
              </span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Zoom In button clicked');
                    if (onZoomIn) {
                      onZoomIn();
                    }
                  }}
                  className="h-9 w-9 p-0 rounded-full"
                  type="button"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Zoom In (Ctrl + =)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Center View button clicked');
                    if (onFitView) {
                      onFitView();
                    }
                  }}
                  className="h-9 w-9 p-0 rounded-full"
                  type="button"
                >
                  <Crosshair className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Center View (Ctrl + 0)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Code View Controls */}
        {viewMode === 'code' && onFormatJSON && (
          <div className="flex items-center px-2 border-r border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Format button clicked');
                    if (onFormatJSON) {
                      onFormatJSON();
                    }
                  }}
                  className="h-9 px-4 rounded-full text-sm font-medium"
                  type="button"
                >
                  Format
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Format JSON</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Save Status & Button */}
        <div className="flex items-center justify-center gap-2 px-4 border-r border-border min-w-[110px]">
          {isSaving ? (
            <div className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Saving...</span>
            </div>
          ) : hasUnsavedChanges ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Save button clicked');
                    if (onSave) {
                      onSave();
                    }
                  }}
                  className="h-9 px-4 rounded-full text-sm font-medium"
                  type="button"
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Save Changes (Ctrl + S)</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-1.5 h-9 px-1">
              <Save className="h-3 w-3 text-green-400 opacity-70" />
              <span className="text-xs text-muted-foreground">Saved</span>
            </div>
          )}
        </div>

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center justify-center h-9 w-9 p-0 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors"
              type="button"
              onClick={() => console.log('More menu button clicked')}
            >
              <MoreVertical className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Export Canvas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {viewMode === 'graph' ? (
              <>
                {onExportPNG && (
                  <DropdownMenuItem onClick={onExportPNG}>
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Export as PNG
                  </DropdownMenuItem>
                )}
                {onExportPDF && (
                  <DropdownMenuItem onClick={onExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
              </>
            ) : null}
            
            {onExportJSON && (
              <DropdownMenuItem onClick={onExportJSON}>
                <Download className="h-4 w-4 mr-2" />
                Export as JSON
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
