import { useMemo, useState } from 'react'
import { Empty, Input, Modal } from 'antd'
import { PRESETS } from '../data/presets'
import { useEditorStore } from '../store/useEditorStore'

/* Xem trước một mẫu: dựng đúng khung thật rồi thu nhỏ bằng transform,
   nên tỉ lệ chữ / khung y hệt lúc in ra A4. */
const PREVIEW_SCALE = 0.9

function PresetPreview({ item }) {
  const boxStyle = {
    '--frame-w': `${item.w}cm`,
    '--frame-h': `${item.h}cm`,
    fontFamily: item.fontFamily,
    fontSize: `${item.fontSize}px`,
    lineHeight: item.lineHeight,
    color: '#111111',
    padding: '2mm',
  }

  return (
    <div
      className="preset-scaler"
      style={{
        width: `calc(${item.w}cm * ${PREVIEW_SCALE})`,
        height: `calc(${item.h}cm * ${PREVIEW_SCALE})`,
      }}
    >
      <div
        className="a4-text framed"
        style={{ ...boxStyle, transform: `scale(${PREVIEW_SCALE})` }}
      >
        <span className="a4-text-inner">{item.text}</span>
        {item.elements.map((el, i) => (
          <span
            key={i}
            className="sub-el text-el"
            style={{
              left: `${el.x}mm`,
              top: `${el.y}mm`,
              width: 'auto',
              fontSize: `${el.fontSize}px`,
              lineHeight: el.lineHeight,
              zIndex: el.z,
            }}
          >
            {el.text}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function PresetModal({ open, onClose }) {
  const addItemFromPreset = useEditorStore((s) => s.addItemFromPreset)
  const [keyword, setKeyword] = useState('')

  const found = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return PRESETS
    return PRESETS.filter(
      (p) => p.item.text.toLowerCase().includes(q) || String(p.id) === q
    )
  }, [keyword])

  const pick = (preset) => {
    addItemFromPreset(preset.item)
    onClose()
  }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={`Mẫu có sẵn (${PRESETS.length} mẫu · khung 3 × 4 cm)`}
      width={1000}
      footer={null}
    >
      <Input.Search
        allowClear
        placeholder="Tìm theo nội dung hoặc số thứ tự…"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      {found.length === 0 ? (
        <Empty description="Không có mẫu nào khớp" />
      ) : (
        <div className="preset-grid">
          {found.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="preset-card"
              title="Bấm để thêm mẫu này vào trang"
              onClick={() => pick(preset)}
            >
              <span className="preset-no">{preset.id}</span>
              <PresetPreview item={preset.item} />
            </button>
          ))}
        </div>
      )}

      <p className="hint" style={{ marginTop: 12 }}>
        Bấm một mẫu để thêm vào trang A4. Sửa danh sách mẫu tại{' '}
        <code>src/data/presets.json</code>.
      </p>
    </Modal>
  )
}
