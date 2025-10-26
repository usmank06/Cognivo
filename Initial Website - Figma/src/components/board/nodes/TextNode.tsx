import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export const TextNode = memo(({ data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Double-click to edit');

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
        px-4 py-2 rounded-lg bg-white border-2 transition-all
        ${selected ? 'border-primary shadow-lg' : 'border-border shadow-sm'}
        min-w-[120px]
      `}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full min-h-[60px] resize-none border-0 outline-none bg-transparent"
        />
      ) : (
        <div className="whitespace-pre-wrap break-words">
          {text}
        </div>
      )}
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
    </div>
  );
});

TextNode.displayName = 'TextNode';
