import { useRef } from 'react'
import { PX_PER_MM } from '../constants'
import { useEditorStore } from '../store/useEditorStore'

const round1 = (v) => Math.round(v * 10) / 10
const clamp = (v, max) => Math.max(0, Math.min(v, Math.max(0, max)))

/* Thành phần con (chữ / ảnh) đặt tự do trong một item.
   Kéo thân để đổi vị trí, kéo ô vuông cam ở góc để đổi kích thước. */
export default function SubElement({ data, itemId, selected, boxRef, setDragLocked }) {
  const nodeRef = useRef(null)

  const style = {
    left: `${data.x}mm`,
    top: `${data.y}mm`,
    transform: data.rotate ? `rotate(${data.rotate}deg)` : undefined,
    height: data.h ? `${data.h}mm` : 'auto',
    zIndex: data.z ?? 2,
  }

  if (data.type === 'image') {
    style.width = `${data.w}mm`
  } else {
    style.width = data.w ? `${data.w}mm` : 'auto'
    style.fontFamily = data.fontFamily
    style.fontSize = `${data.fontSize}px`
    style.fontWeight = data.bold ? 'bold' : 'normal'
    style.fontStyle = data.italic ? 'italic' : 'normal'
    style.textDecoration = data.underline ? 'underline' : 'none'
    style.color = data.color
    style.lineHeight = data.lineHeight
  }

  const handlePointerDown = (e) => {
    const node = nodeRef.current
    const box = boxRef.current
    if (!node || !box) return

    e.preventDefault()
    e.stopPropagation()

    const { selectItem, patchElement } = useEditorStore.getState()
    selectItem(itemId, data.id)

    // Tắt HTML5 drag của item để không xung đột với thao tác kéo này
    setDragLocked(true)
    node.classList.add('dragging-el')
    node.setPointerCapture(e.pointerId)

    const startX = e.clientX
    const startY = e.clientY
    // chia cho scale vì trang A4 đang bị transform: scale()
    const scale = useEditorStore.getState().scale || 1
    const isResize = Boolean(e.target.closest('.resize-handle'))

    let onMove
    const cleanup = () => {
      node.classList.remove('dragging-el')
      setDragLocked(false)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerup', cleanup)
      node.removeEventListener('pointercancel', cleanup)
    }

    if (isResize) {
      // ----- Kéo tay nắm ở góc: đổi kích thước -----
      const startW = data.w || node.offsetWidth / PX_PER_MM
      const startH = data.h || node.offsetHeight / PX_PER_MM
      // Ảnh chưa đặt chiều cao thì giữ tỉ lệ gốc (height: auto)
      const keepRatio = data.type === 'image' && !data.h

      onMove = (ev) => {
        const dx = (ev.clientX - startX) / scale / PX_PER_MM
        const dy = (ev.clientY - startY) / scale / PX_PER_MM
        const maxW = box.clientWidth / PX_PER_MM - data.x
        const maxH = box.clientHeight / PX_PER_MM - data.y

        const w = round1(Math.min(Math.max(startW + dx, 3), maxW))
        const h = keepRatio
          ? 0 // height: auto -> tỉ lệ gốc tự giữ
          : round1(Math.min(Math.max(startH + dy, 3), maxH))
        patchElement(itemId, data.id, { w, h })
      }
    } else {
      // ----- Kéo thân: đổi vị trí -----
      const originX = data.x
      const originY = data.y
      // Giới hạn: thành phần không ra khỏi lòng khung (padding box)
      const maxX = (box.clientWidth - node.offsetWidth) / PX_PER_MM
      const maxY = (box.clientHeight - node.offsetHeight) / PX_PER_MM

      onMove = (ev) => {
        const dx = (ev.clientX - startX) / scale / PX_PER_MM
        const dy = (ev.clientY - startY) / scale / PX_PER_MM
        patchElement(itemId, data.id, {
          x: round1(clamp(originX + dx, maxX)),
          y: round1(clamp(originY + dy, maxY)),
        })
      }
    }

    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerup', cleanup)
    node.addEventListener('pointercancel', cleanup)
  }

  const className = [
    'sub-el',
    data.type === 'image' ? 'image-el' : 'text-el',
    data.type === 'image' && data.h ? 'fixed-h' : '',
    selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={nodeRef}
      className={className}
      style={style}
      onPointerDown={handlePointerDown}
    >
      {data.type === 'image' ? <img src={data.src} alt="" /> : data.text || ' '}
      <span className="resize-handle" />
    </div>
  )
}
