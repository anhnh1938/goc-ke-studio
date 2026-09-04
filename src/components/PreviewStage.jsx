import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { DownloadOutlined, PrinterOutlined } from '@ant-design/icons'
import { exportPagePng, printPage } from '../lib/output'
import { useEditorStore } from '../store/useEditorStore'
import FrameItem from './FrameItem'

// Cùng biên với slider "Mức zoom" ở tab Preview
const ZOOM_MIN = 25
const ZOOM_MAX = 500
const clampZoom = (v) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v))

/* Vùng xem trước: trang A4 thật (210 × 297 mm) được thu phóng bằng transform:
   scale(). Khung .a4-viewport giữ chỗ đúng bằng kích thước sau khi thu nhỏ. */
export default function PreviewStage() {
  const items = useEditorStore((s) => s.items)
  const page = useEditorStore((s) => s.page)
  const setScale = useEditorStore((s) => s.setScale)
  const setPage = useEditorStore((s) => s.setPage)
  const reorder = useEditorStore((s) => s.reorder)
  const selectItem = useEditorStore((s) => s.selectItem)
  const selectedId = useEditorStore((s) => s.selectedId)
  const selectedElId = useEditorStore((s) => s.selectedElId)

  const sectionRef = useRef(null)
  const viewportRef = useRef(null)
  const scalerRef = useRef(null)
  const paperRef = useRef(null)

  const [percent, setPercent] = useState(100)

  // Hệ số zoom của lần vẽ trước + điểm cần neo lại, dùng cho zoom bằng lăn chuột.
  // Phải hoãn tới updateScale mới chỉnh được scrollLeft/Top: lúc đó khung giữ chỗ
  // mới có kích thước mới.
  const scaleRef = useRef(1)
  const anchorRef = useRef(null) // { cx, cy } — vị trí con trỏ so với vùng cuộn

  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const r = await exportPagePng(paperRef.current, page.exportDpi)
      message.success(
        `Đã xuất ảnh ${r.width} × ${r.height} px · ${page.exportDpi} dpi · ` +
          `${(r.bytes / 1024 / 1024).toFixed(1)} MB`
      )
    } catch (err) {
      message.error(`Không xuất được ảnh: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

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

    /* Giữ điểm dưới con trỏ đứng yên khi zoom bằng lăn chuột. Khi trang lớn hơn
       khung thì `align-items: safe center` rơi về canh đầu, nên nội dung nở ra từ
       góc trên–trái và công thức này khớp chính xác. */
    const anchor = anchorRef.current
    anchorRef.current = null
    if (anchor && scaleRef.current) {
      const ratio = scale / scaleRef.current
      section.scrollLeft = (section.scrollLeft + anchor.cx) * ratio - anchor.cx
      section.scrollTop = (section.scrollTop + anchor.cy) * ratio - anchor.cy
    }
    scaleRef.current = scale

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

  /* Lăn chuột = zoom (neo vào con trỏ), kéo nền = di chuyển tầm nhìn.
     Phải gắn listener thủ công: React đăng ký `wheel` ở dạng passive nên
     preventDefault() trong onWheel không có tác dụng, trang vẫn cuộn theo. */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const onWheel = (e) => {
      e.preventDefault()
      const rect = section.getBoundingClientRect()
      anchorRef.current = { cx: e.clientX - rect.left, cy: e.clientY - rect.top }
      // exp() để mỗi nhịp lăn đổi theo tỉ lệ, zoom nhỏ hay lớn đều mượt như nhau
      const next = clampZoom(
        Math.round(scaleRef.current * Math.exp(-e.deltaY * 0.0015) * 100)
      )
      setPage({ zoomMode: 'manual', zoomLevel: next })
    }

    const onPointerDown = (e) => {
      // Cảm ứng đã có cuộn sẵn của browser; giành lấy thì phải tự lo cả đà cuộn.
      if (e.pointerType === 'touch' || e.button !== 0) return
      // Item và các nút có cơ chế riêng (đổi thứ tự, kéo thành phần con, bấm)
      if (e.target.closest('.frame-item, .preview-toolbar, button')) return

      e.preventDefault()
      const startX = e.clientX
      const startY = e.clientY
      const startLeft = section.scrollLeft
      const startTop = section.scrollTop
      section.classList.add('panning')
      section.setPointerCapture(e.pointerId)

      const onMove = (ev) => {
        section.scrollLeft = startLeft - (ev.clientX - startX)
        section.scrollTop = startTop - (ev.clientY - startY)
      }
      const cleanup = () => {
        section.classList.remove('panning')
        section.removeEventListener('pointermove', onMove)
        section.removeEventListener('pointerup', cleanup)
        section.removeEventListener('pointercancel', cleanup)
      }
      section.addEventListener('pointermove', onMove)
      section.addEventListener('pointerup', cleanup)
      section.addEventListener('pointercancel', cleanup)
    }

    section.addEventListener('wheel', onWheel, { passive: false })
    section.addEventListener('pointerdown', onPointerDown)
    return () => {
      section.removeEventListener('wheel', onWheel)
      section.removeEventListener('pointerdown', onPointerDown)
    }
  }, [setPage])

  /* Cuộn item đang chọn vào tầm nhìn. Zoom lớn hoặc trang nhiều item thì thứ
     đang sửa dễ nằm ngoài vùng thấy được, sửa mà không thấy gì đổi.
     `nearest` để không giật màn hình khi nó đã nằm trong tầm nhìn rồi. */
  useEffect(() => {
    const el = sectionRef.current?.querySelector('.frame-item.selected')
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selectedId, selectedElId])

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
        <span className="zoom-badge">{percent}%</span>
        <Button
          size="small"
          disabled={page.zoomMode === 'auto'}
          onClick={() => setPage({ zoomMode: 'auto' })}
        >
          Vừa khung
        </Button>
        <Button
          size="small"
          icon={<DownloadOutlined />}
          loading={exporting}
          onClick={handleExport}
        >
          Xuất PNG
        </Button>
        <Button size="small" icon={<PrinterOutlined />} onClick={printPage}>
          In
        </Button>
        <span className="toolbar-hint">Lăn chuột để zoom · kéo nền để di chuyển</span>
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
