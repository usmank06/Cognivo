import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const ShapeNode = memo(({ data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Shape');

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    data.label = text;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setText(data.label);
      setIsEditing(false);
    }
  };

  return (
    <div
      className={`
        px-6 py-4 rounded-xl bg-primary/5 border-2 transition-all
        ${selected ? 'border-primary shadow-lg' : 'border-primary/30 shadow-sm'}
        min-w-[150px] min-h-[100px] flex items-center justify-center
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full text-center border-0 outline-none bg-transparent"
        />
      ) : (
        <div className="text-center">
          {text}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
});

ShapeNode.displayName = 'ShapeNode';
