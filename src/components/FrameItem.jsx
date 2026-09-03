import { useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import SubElement from './SubElement'

/* Một item trên trang A4: khung text chính + các thành phần con đặt tự do. */
export default function FrameItem({
  item,
  dropMark,
  isDragging,
  onSelect,
  onDragStart,
  onDragOver,
  onDrop,
}) {
  const selectedId = useEditorStore((s) => s.selectedId)
  const selectedElId = useEditorStore((s) => s.selectedElId)
  const copyItem = useEditorStore((s) => s.copyItem)
  const deleteItem = useEditorStore((s) => s.deleteItem)

  const boxRef = useRef(null)
  // Khoá HTML5 drag của item khi đang kéo một thành phần con bên trong
  const [dragLocked, setDragLocked] = useState(false)

  const selected = item.id === selectedId
  const framed = Boolean(item.w && item.h)

  const boxStyle = {
    fontFamily: item.fontFamily,
    fontSize: `${item.fontSize}px`,
    fontWeight: item.bold ? 'bold' : 'normal',
    fontStyle: item.italic ? 'italic' : 'normal',
    color: item.color,
    lineHeight: item.lineHeight,
    padding: `${item.padTop}mm ${item.padRight}mm ${item.padBottom}mm ${item.padLeft}mm`,
  }
  if (framed) {
    boxStyle['--frame-w'] = `${item.w}cm`
    boxStyle['--frame-h'] = `${item.h}cm`
  }

  const className = [
    'frame-item',
    selected ? 'selected' : '',
    isDragging ? 'dragging' : '',
    dropMark ? (dropMark.after ? 'drop-after' : 'drop-before') : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={className}
      draggable={!dragLocked}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(item.id)) // Firefox cần dòng này
        onDragStart(item.id)
      }}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDrop={(e) => onDrop(e, item.id)}
      onClick={(e) => {
        // Click vào thành phần con đã được pointerdown xử lý, không reset selection
        if (e.target.closest('.sub-el')) return
        onSelect(item.id)
      }}
    >
      <div className="item-tools">
        <button
          type="button"
          className="copy"
          title="Nhân bản"
          onClick={(e) => {
            e.stopPropagation()
            copyItem(item.id)
          }}
        >
          ⧉
        </button>
        <button
          type="button"
          className="del"
          title="Xóa"
          onClick={(e) => {
            e.stopPropagation()
            deleteItem(item.id)
          }}
        >
          ✕
        </button>
      </div>

      <div
        ref={boxRef}
        className={[
          'a4-text',
          framed ? 'framed' : '',
          item.showPad ? 'show-padding' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={boxStyle}
      >
        <span
          className="a4-text-inner"
          style={{ textDecoration: item.underline ? 'underline' : 'none' }}
        >
          {item.text || ' '}
        </span>

        {item.elements.map((data) => (
          <SubElement
            key={data.id}
            data={data}
            itemId={item.id}
            selected={selected && data.id === selectedElId}
            boxRef={boxRef}
            setDragLocked={setDragLocked}
          />
        ))}
      </div>

      {framed && (
        <div className="frame-caption">
          Khung {item.h} × {item.w} cm
        </div>
      )}
    </div>
  )
}
