// ElementNode.tsx - Text elements and dividers
import { useCallback } from 'react'
import { NodeResizer, NodeToolbar, useReactFlow } from 'reactflow'
import type { NodeData, RFNode, ElementKind } from './types'
import { DESIGN_SYSTEM } from '../../../lib/designSystem'

interface ElementNodeProps {
  id: string
  data: NodeData
  selected: boolean
}

function useNodeUpdater() {
  const { setNodes } = useReactFlow()
  return useCallback((id: string, updater: (n: RFNode) => RFNode) => {
    setNodes((nds: any[]) => nds.map((n: any) => (n.id === id ? updater(n as RFNode) : n)))
  }, [setNodes])
}

export function ElementNode({ id, data, selected }: ElementNodeProps) {
  const updateNode = useNodeUpdater()
  
  const kind = data.kind as ElementKind
  const text = data.text ?? 'Text'
  
  // Use design system defaults based on element type
  const isDivider = kind === 'horizontalDivider' || kind === 'verticalDivider'
  
  const fontSize = data.fontSize ?? (
    kind === 'title' ? DESIGN_SYSTEM.elementDefaults.title.fontSize :
    kind === 'sectionHeader' ? DESIGN_SYSTEM.elementDefaults.sectionHeader.fontSize :
    DESIGN_SYSTEM.elementDefaults.text.fontSize
  )
  
  const fontWeight = data.fontWeight ?? (
    kind === 'title' ? DESIGN_SYSTEM.elementDefaults.title.fontWeight :
    kind === 'sectionHeader' ? DESIGN_SYSTEM.elementDefaults.sectionHeader.fontWeight :
    DESIGN_SYSTEM.elementDefaults.text.fontWeight
  )
  
  const textAlign = data.textAlign ?? 'left'
  
  const textColor = data.textColor ?? (
    kind === 'title' || kind === 'sectionHeader' ? DESIGN_SYSTEM.colors.neutral[800] :
    DESIGN_SYSTEM.colors.neutral[700]
  )
  
  const bgColor = data.backgroundColor ?? (
    kind === 'sectionHeader' ? DESIGN_SYSTEM.colors.neutral[50] :
    isDivider ? 'transparent' :
    '#ffffff'
  )
  
  const dividerColor = data.dividerColor ?? DESIGN_SYSTEM.borders.color.base
  const dividerThickness = data.dividerThickness ?? 2

  // Inline text editing
  const onTextBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.textContent ?? ''
    updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, text: newText } }))
  }
  
  const onTextKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ;(e.currentTarget as HTMLDivElement).blur()
    }
  }

  // Toolbar edits
  const setKind = (k: ElementKind) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, kind: k } }))
  const setFontSize = (val: number) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, fontSize: val } }))
  const setFontWeight = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, fontWeight: val } }))
  const setTextColor = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, textColor: val } }))
  const setBgColor = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, backgroundColor: val } }))
  const setDividerColor = (val: string) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, dividerColor: val } }))
  const setDividerThickness = (val: number) => updateNode(id, (n: RFNode) => ({ ...n, data: { ...n.data, dividerThickness: val } }))

  const renderElement = () => {
    switch (kind) {
      case 'text':
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={onTextBlur}
            onKeyDown={onTextKeyDown}
            style={{
              fontSize: fontSize || 14,
              fontWeight: fontWeight || 'normal',
              color: textColor,
              padding: '12px 16px',
              outline: 'none',
              cursor: 'text',
              userSelect: 'text',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              textAlign: textAlign,
              width: '100%',
              height: '100%',
              overflow: 'auto'
            }}
          >
            {text}
          </div>
        )
      
      case 'title':
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={onTextBlur}
            onKeyDown={onTextKeyDown}
            style={{
              fontSize: fontSize || 24,
              fontWeight: fontWeight || 'bold',
              color: textColor,
              padding: '12px 16px',
              outline: 'none',
              cursor: 'text',
              userSelect: 'text',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {text}
          </div>
        )
      
      case 'sectionHeader':
        return (
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={onTextBlur}
            onKeyDown={onTextKeyDown}
            style={{
              fontSize: fontSize || 18,
              fontWeight: fontWeight || '600',
              color: textColor,
              padding: '8px 12px',
              borderBottom: `2px solid ${dividerColor}`,
              outline: 'none',
              cursor: 'text',
              userSelect: 'text',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {text}
          </div>
        )
      
      case 'horizontalDivider':
        return (
          <div style={{ 
            width: '100%', 
            height: dividerThickness, 
            background: dividerColor 
          }} />
        )
      
      case 'verticalDivider':
        return (
          <div style={{ 
            width: dividerThickness, 
            height: '100%', 
            background: dividerColor 
          }} />
        )
      
      default:
        return <div style={{ padding: 20, color: '#999' }}>Unknown element type</div>
    }
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100%', 
      background: bgColor, 
      borderRadius: DESIGN_SYSTEM.borders.radius.lg, 
      boxShadow: isDivider ? 'none' : DESIGN_SYSTEM.shadows.md, 
      border: isDivider ? 'none' : `${DESIGN_SYSTEM.borders.width.base} solid ${DESIGN_SYSTEM.borders.color.light}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      fontFamily: DESIGN_SYSTEM.typography.fontFamily,
    }}>
      {/* Resizer handles */}
      <NodeResizer 
        isVisible={selected} 
        minWidth={kind === 'verticalDivider' ? 10 : 100} 
        minHeight={kind === 'horizontalDivider' ? 10 : 40} 
        handleStyle={{ 
          width: 12, 
          height: 12, 
          borderRadius: 6,
          background: DESIGN_SYSTEM.colors.primary[500],
          border: '2px solid white',
          boxShadow: DESIGN_SYSTEM.shadows.sm,
        }} 
      />

      {/* Element content */}
      {renderElement()}

      {/* Toolbar */}
      <NodeToolbar isVisible={selected} position={"top" as any}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: DESIGN_SYSTEM.spacing.sm, 
          background: 'white', 
          padding: '10px 12px', 
          border: `${DESIGN_SYSTEM.borders.width.base} solid ${DESIGN_SYSTEM.borders.color.light}`, 
          borderRadius: DESIGN_SYSTEM.borders.radius.lg, 
          boxShadow: DESIGN_SYSTEM.shadows.lg,
          maxWidth: 600,
          fontFamily: DESIGN_SYSTEM.typography.fontFamily,
        }}>
          {/* Row 1: Type selector */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11, color: '#555', fontWeight: 600 }}>Type</label>
            <select value={kind} onChange={(e: any) => setKind(e.target.value as ElementKind)} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
              <option value="text">Text</option>
              <option value="title">Title</option>
              <option value="sectionHeader">Section Header</option>
              <option value="horizontalDivider">Horizontal Divider</option>
              <option value="verticalDivider">Vertical Divider</option>
            </select>
          </div>

          {/* Row 2: Styling options (conditional) */}
          {(kind === 'text' || kind === 'title' || kind === 'sectionHeader') && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
              <label style={{ fontSize: 11, color: '#555' }}>Font Size</label>
              <input 
                type="number" 
                value={fontSize} 
                onChange={(e: any) => setFontSize(parseInt(e.target.value) || 16)} 
                style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
              />
              
              <label style={{ fontSize: 11, color: '#555' }}>Weight</label>
              <select value={fontWeight} onChange={(e: any) => setFontWeight(e.target.value)} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }}>
                <option value="normal">Normal</option>
                <option value="500">Medium</option>
                <option value="600">Semibold</option>
                <option value="bold">Bold</option>
              </select>
              
              <div className="h-4 w-px bg-border mx-1" />
              
              <label style={{ fontSize: 11, color: '#555' }}>Text</label>
              <input 
                type="color" 
                value={textColor} 
                onChange={(e: any) => setTextColor(e.target.value)} 
                style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }} 
              />
              
              <label style={{ fontSize: 11, color: '#555' }}>BG</label>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e: any) => setBgColor(e.target.value)} 
                style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }} 
              />
            </div>
          )}

          {(kind === 'horizontalDivider' || kind === 'verticalDivider') && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
              <label style={{ fontSize: 11, color: '#555' }}>Thickness</label>
              <input 
                type="number" 
                value={dividerThickness} 
                onChange={(e: any) => setDividerThickness(parseInt(e.target.value) || 2)} 
                style={{ width: 50, fontSize: 11, padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: 6 }} 
              />
              
              <label style={{ fontSize: 11, color: '#555' }}>Color</label>
              <input 
                type="color" 
                value={dividerColor} 
                onChange={(e: any) => setDividerColor(e.target.value)} 
                style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }} 
              />
              
              <label style={{ fontSize: 11, color: '#555' }}>BG</label>
              <input 
                type="color" 
                value={bgColor} 
                onChange={(e: any) => setBgColor(e.target.value)} 
                style={{ width: 40, height: 24, border: '1px solid #e5e7eb', borderRadius: 6, cursor: 'pointer' }} 
              />
            </div>
          )}
        </div>
      </NodeToolbar>
    </div>
  )
}
