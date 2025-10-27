import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import type { Canvas } from '../BoardPage';

interface CanvasAreaProps {
  canvas: Canvas;
  username: string;
  script: string;
  onScriptChange: (script: string) => void;
}

export function CanvasArea({ canvas, username, script, onScriptChange }: CanvasAreaProps) {
  const [localScript, setLocalScript] = useState(script);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update local script when canvas changes
  useEffect(() => {
    setLocalScript(script);
    setHasUnsavedChanges(false);
  }, [script, canvas.id]);

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
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        onScriptChange(scriptToSave);
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

  const handleExport = () => {
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
      toast.success('Canvas exported!');
    } catch (error) {
      toast.error('Failed to export canvas');
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

  const formatLastSaved = () => {
    if (!lastSaved) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastSaved.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffSecs < 5) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return lastSaved.toLocaleTimeString();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">{canvas.name}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {isSaving ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Last saved: {formatLastSaved()}</span>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 ml-2">
                      Unsaved changes
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={formatScript}
          >
            Format JSON
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Now
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Script Editor */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-slate-900 rounded-lg overflow-hidden border border-border shadow-inner">
          <textarea
            value={localScript}
            onChange={handleScriptChange}
            className="w-full h-full bg-slate-900 text-slate-100 p-6 font-mono text-sm resize-none focus:outline-none"
            placeholder='{"nodes": [], "edges": []}'
            spellCheck={false}
          />
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="px-6 py-3 bg-card border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Canvas ID: {canvas.id}</span>
            <span>•</span>
            <span>Chats: {canvas.chatCount || 0}</span>
          </div>
          <div>
            Auto-saves 2 seconds after last edit
          </div>
        </div>
      </div>
    </div>
  );
}
