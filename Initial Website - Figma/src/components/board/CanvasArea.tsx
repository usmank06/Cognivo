import { useCallback, useMemo } from 'react';
import { Code2, Layout, Download, Image as ImageIcon, Plus, Type, Square, Circle, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { TextNode } from './nodes/TextNode';
import { ShapeNode } from './nodes/ShapeNode';
import type { Board } from '../BoardPage';

interface CanvasAreaProps {
  board: Board;
  viewMode: 'canvas' | 'code';
  onViewModeChange: (mode: 'canvas' | 'code') => void;
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: 250, y: 100 },
    data: { label: 'Welcome to your board!\nDouble-click to edit' },
  },
  {
    id: '2',
    type: 'shapeNode',
    position: { x: 100, y: 300 },
    data: { label: 'Shape Node' },
  },
];

const initialEdges: Edge[] = [];

function CanvasAreaContent({ board, viewMode, onViewModeChange }: CanvasAreaProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      textNode: TextNode,
      shapeNode: ShapeNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addTextNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'textNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New text node\nDouble-click to edit' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addShapeNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'shapeNode',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New Shape' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const clearCanvas = useCallback(() => {
    if (confirm('Are you sure you want to clear the canvas?')) {
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

  const exportAsJSON = useCallback(() => {
    const data = {
      board: board.name,
      nodes,
      edges,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${board.name}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [board.name, nodes, edges]);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top Controls */}
      <div className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
        <div className="flex items-center gap-4">
          <Tabs value={viewMode} onValueChange={(v) => onViewModeChange(v as 'canvas' | 'code')}>
            <TabsList>
              <TabsTrigger value="canvas" className="gap-2">
                <Layout className="h-4 w-4" />
                Canvas
              </TabsTrigger>
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {viewMode === 'canvas' && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Node
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={addTextNode}>
                    <Type className="h-4 w-4 mr-2" />
                    Text Node
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={addShapeNode}>
                    <Square className="h-4 w-4 mr-2" />
                    Shape Node
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm" onClick={clearCanvas}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportAsJSON}>
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Export Image
          </Button>
        </div>
      </div>

      {/* Canvas/Code Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'canvas' ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            deleteKeyCode="Delete"
            multiSelectionKeyCode="Shift"
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#0ea5e9', strokeWidth: 2 },
            }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls 
              showInteractive={false}
              className="bg-white border border-border rounded-lg shadow-lg"
            />
            <MiniMap 
              nodeColor="#0ea5e9"
              maskColor="rgba(0, 0, 0, 0.05)"
              className="bg-white border border-border rounded-lg"
              zoomable
              pannable
            />
            <Panel position="bottom-center" className="bg-white/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{nodes.length} nodes</span>
                <span>•</span>
                <span>{edges.length} edges</span>
                <span>•</span>
                <span className="text-xs">Double-click nodes to edit • Delete key to remove</span>
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="w-full h-full bg-slate-900 text-slate-100 p-6 font-mono text-sm overflow-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-slate-400">
                  {`// ${board.name} - Board Data (JSON)`}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exportAsJSON}
                  className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                >
                  <Download className="h-3 w-3 mr-2" />
                  Download
                </Button>
              </div>
              <pre className="text-slate-300 leading-relaxed">
                {JSON.stringify({ 
                  boardName: board.name,
                  nodes: nodes.map(n => ({
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: n.data,
                  })),
                  edges: edges.map(e => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                  })),
                }, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CanvasArea(props: CanvasAreaProps) {
  return (
    <ReactFlowProvider>
      <CanvasAreaContent {...props} />
    </ReactFlowProvider>
  );
}
