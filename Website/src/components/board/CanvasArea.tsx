import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Canvas } from '../CanvasPage';
import { GraphCanvas, GraphCanvasHandle } from './canvas/GraphCanvas';
import { FloatingCanvasToolbar } from './canvas/FloatingCanvasToolbar';

interface CanvasAreaProps {
  canvas: Canvas;
  username: string;
  script: string;
  onScriptChange: (script: string) => void;
}

export function CanvasArea({ canvas, username, script, onScriptChange }: CanvasAreaProps) {
  const [localScript, setLocalScript] = useState(script);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'code'>('graph');
  const [zoomLevel, setZoomLevel] = useState(100);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const graphCanvasRef = useRef<GraphCanvasHandle>(null);

  // Update local script when canvas changes
  useEffect(() => {
    setLocalScript(script);
    setHasUnsavedChanges(false);
  }, [script, canvas.id]);

  // Poll zoom level from ReactFlow
  useEffect(() => {
    if (viewMode === 'graph') {
      const interval = setInterval(() => {
        const zoom = graphCanvasRef.current?.getZoomLevel();
        if (zoom !== undefined) {
          setZoomLevel(zoom);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [viewMode]);

  // Auto-save with debounce (2 seconds after last edit)
  useEffect(() => {
    if (localScript !== script) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout to save
      saveTimeoutRef.current = setTimeout(() => {
        saveScript(localScript);
      }, 2000); // 2 second debounce
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localScript]);

  const saveScript = async (scriptToSave: string) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/canvas/${username}/${canvas.id}/script`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: scriptToSave }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setHasUnsavedChanges(false);
        onScriptChange(scriptToSave);
        toast.success('Canvas saved successfully!');
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalScript(e.target.value);
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveScript(localScript);
  };

  const handleExportJSON = () => {
    try {
      const blob = new Blob([localScript], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${canvas.name}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Canvas exported as JSON!');
    } catch (error) {
      toast.error('Failed to export canvas');
    }
  };

  const handleExportPNG = async () => {
    try {
      await graphCanvasRef.current?.exportPNG();
      toast.success('Canvas exported as PNG!');
    } catch (error) {
      toast.error('Failed to export PNG');
    }
  };

  const handleExportPDF = async () => {
    try {
      await graphCanvasRef.current?.exportPDF();
      toast.success('Canvas exported as PDF!');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const formatScript = () => {
    try {
      const parsed = JSON.parse(localScript);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalScript(formatted);
      toast.success('Script formatted!');
    } catch (error) {
      toast.error('Invalid JSON - cannot format');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Canvas Content Area - Full Height */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'graph' ? (
          <div className="h-full w-full bg-background relative">
            {/* Floating Toolbar for Graph View */}
            <FloatingCanvasToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onZoomIn={() => {
                console.log('Zoom In clicked');
                graphCanvasRef.current?.zoomIn();
              }}
              onZoomOut={() => {
                console.log('Zoom Out clicked');
                graphCanvasRef.current?.zoomOut();
              }}
              onFitView={() => {
                console.log('Fit View clicked');
                graphCanvasRef.current?.fitView();
              }}
              onExportPNG={handleExportPNG}
              onExportPDF={handleExportPDF}
              onExportJSON={handleExportJSON}
              onSave={handleManualSave}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
              zoomLevel={zoomLevel}
            />
            
            <GraphCanvas 
              ref={graphCanvasRef}
              script={localScript} 
              onChange={setLocalScript} 
            />
          </div>
        ) : (
          <div className="h-full w-full bg-white relative">
            {/* Floating Toolbar for Code View */}
            <FloatingCanvasToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onFormatJSON={formatScript}
              onExportJSON={handleExportJSON}
              onSave={handleManualSave}
              isSaving={isSaving}
              hasUnsavedChanges={hasUnsavedChanges}
            />
            
            {/* Code editor */}
            <textarea
              value={localScript}
              onChange={handleScriptChange}
              className="w-full h-full bg-background text-foreground px-6 py-6 font-mono text-sm resize-none focus:outline-none leading-6 border-0"
              placeholder='{"nodes": [], "edges": []}'
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
