import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { useEditorStore } from '../store/useEditorStore'
import FrameItem from './FrameItem'

/* Vùng xem trước: trang A4 thật (210 × 297 mm) được thu phóng bằng transform:
   scale(). Khung .a4-viewport giữ chỗ đúng bằng kích thước sau khi thu nhỏ. */
export default function PreviewStage() {
  const items = useEditorStore((s) => s.items)
  const page = useEditorStore((s) => s.page)
  const setScale = useEditorStore((s) => s.setScale)
  const reorder = useEditorStore((s) => s.reorder)
  const selectItem = useEditorStore((s) => s.selectItem)

  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const scalerRef = useRef(null)
  const paperRef = useRef(null)

  const [percent, setPercent] = useState(100)

  // Kéo thả để đổi thứ tự item.
  // Ref cho logic (đọc ngay trong event), state để vẽ lại item đang bị kéo.
  const dragIdRef = useRef(null)
  const [dragId, setDragId] = useState(null)
  const [dropMark, setDropMark] = useState(null) // { id, after }

  const updateScale = useCallback(() => {
    const section = sectionRef.current
    const paper = paperRef.current
    const viewport = viewportRef.current
    const scaler = scalerRef.current
    if (!section || !paper || !viewport || !scaler) return

    const available = section.clientWidth - 32
    const pageWidth = paper.offsetWidth
    const pageHeight = paper.offsetHeight
    if (!pageWidth) return

    const scale =
      page.zoomMode === 'manual'
        ? page.zoomLevel / 100
        : Math.min(1, available / pageWidth)

    scaler.style.transform = `scale(${scale})`
    viewport.style.width = `${pageWidth * scale}px`
    viewport.style.height = `${pageHeight * scale}px`

    // Nghịch đảo scale, cho phần UI nổi trên trang tự bù lại phép thu nhỏ và
    // giữ đúng kích thước thật trên màn hình (xem .item-tools ở index.css).
    paper.style.setProperty('--inv-scale', String(1 / (scale || 1)))

    setScale(scale) // dùng khi kéo thành phần con
    setPercent(Math.round(scale * 100))
  }, [page.zoomMode, page.zoomLevel, setScale])

  // Chỉ quan sát tờ giấy, KHÔNG quan sát vùng cuộn: đổi kích thước viewport có thể
  // làm thanh cuộn xuất hiện/biến mất -> quan sát cả hai sẽ dao động qua lại.
  useLayoutEffect(() => {
    updateScale()
    const observer = new ResizeObserver(updateScale)
    if (paperRef.current) observer.observe(paperRef.current)
    window.addEventListener('resize', updateScale)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [updateScale])

  const handleDragStart = (id) => {
    dragIdRef.current = id
    setDragId(id)
  }

  const handleDragOver = (e, id) => {
    if (dragIdRef.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (id === dragIdRef.current) return setDropMark(null)
    // Chia đôi theo chiều ngang: thả trước hay sau item đang hover
    const rect = e.currentTarget.getBoundingClientRect()
    const after = e.clientX > rect.left + rect.width / 2
    // dragover bắn liên tục -> chỉ set khi vạch báo thật sự đổi chỗ
    setDropMark((prev) =>
      prev && prev.id === id && prev.after === after ? prev : { id, after }
    )
  }

  const handleDrop = (e, id) => {
    if (dragIdRef.current === null) return
    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    reorder(dragIdRef.current, id, e.clientX > rect.left + rect.width / 2)
    dragIdRef.current = null
    setDragId(null)
    setDropMark(null)
  }

  const handleDragEnd = () => {
    dragIdRef.current = null
    setDragId(null)
    setDropMark(null)
  }

  return (
    <main
      className="preview-section"
      ref={sectionRef}
      style={{ backgroundColor: page.stageColor }}
    >
      <div className="preview-toolbar">
        <span>Xem trước A4 · 210 × 297 mm</span>
        <span>{percent}%</span>
      </div>

      <div className="a4-viewport" ref={viewportRef}>
        <div className="a4-scaler" ref={scalerRef}>
          <div
            className="a4-page"
            ref={paperRef}
            style={{ padding: `${page.pageMargin || 0}mm` }}
          >
            <div
              className={[
                'items-area',
                page.showBorder ? '' : 'hide-border',
                page.showCaption ? '' : 'hide-caption',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{ gap: `${page.itemGap || 0}mm` }}
              onDragEnd={handleDragEnd}
            >
              {items.map((item) => (
                <FrameItem
                  key={item.id}
                  item={item}
                  dropMark={dropMark?.id === item.id ? dropMark : null}
                  isDragging={dragId === item.id}
                  onSelect={selectItem}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))}
            </div>
            {items.length === 0 && (
              <p className="empty-note">
                Chưa có item nào — bấm "+ Thêm mới" ở panel bên phải.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
