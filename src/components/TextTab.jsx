import { useState } from 'react'
import { Button, Checkbox, InputNumber, Upload } from 'antd'
import {
  AppstoreOutlined,
  CloseOutlined,
  CopyOutlined,
  FileImageOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { FRAME_SIZES } from '../constants'
import {
  selectSelectedEl,
  selectSelectedItem,
  useEditorStore,
} from '../store/useEditorStore'
import ElementModal from './ElementModal'
import PresetModal from './PresetModal'
import TypographyFields from './TypographyFields'

const PAD_FIELDS = [
  { key: 'padTop', label: 'Trên' },
  { key: 'padRight', label: 'Phải' },
  { key: 'padBottom', label: 'Dưới' },
  { key: 'padLeft', label: 'Trái' },
]

export default function TextTab() {
  const items = useEditorStore((s) => s.items)
  const selectedId = useEditorStore((s) => s.selectedId)
  const selectedElId = useEditorStore((s) => s.selectedElId)
  const item = useEditorStore(selectSelectedItem)
  const subEl = useEditorStore(selectSelectedEl)

  const addItem = useEditorStore((s) => s.addItem)
  const copyItem = useEditorStore((s) => s.copyItem)
  const deleteItem = useEditorStore((s) => s.deleteItem)
  const selectItem = useEditorStore((s) => s.selectItem)
  const selectElement = useEditorStore((s) => s.selectElement)
  const openElModal = useEditorStore((s) => s.openElModal)
  const updateSelected = useEditorStore((s) => s.updateSelected)
  const addElement = useEditorStore((s) => s.addElement)
  const copyElement = useEditorStore((s) => s.copyElement)
  const deleteElement = useEditorStore((s) => s.deleteElement)

  const [padLock, setPadLock] = useState(false)
  const [presetOpen, setPresetOpen] = useState(false)

  const index = items.findIndex((it) => it.id === selectedId)

  const status = items.length
    ? item
      ? `Đang sửa item ${index + 1} / ${items.length}` +
        (subEl ? ` → ${subEl.type === 'image' ? 'ảnh' : 'chữ'} con` : ' → text chính')
      : `Chưa chọn item nào (${items.length} item trên trang)`
    : 'Trang đang trống'

  const setPad = (key, value) => {
    const v = Number(value) || 0
    if (padLock) {
      updateSelected({ padTop: v, padRight: v, padBottom: v, padLeft: v })
    } else {
      updateSelected({ [key]: v })
    }
  }

  const readImage = (file) => {
    const reader = new FileReader()
    reader.onload = () => addElement({ type: 'image', src: reader.result, w: 20 })
    reader.readAsDataURL(file)
    return false // chặn upload thật, chỉ đọc thành data URL
  }

  return (
    <div className={'settings-grid' + (item ? '' : ' locked')}>
      {/* 0. Quản lý item */}
      <div className="form-group full always-on">
        <span className="form-label">Item trên trang:</span>
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <Button
            block
            icon={<AppstoreOutlined />}
            onClick={() => setPresetOpen(true)}
          >
            Chọn mẫu có sẵn
          </Button>
        </div>
        <div className="btn-row">
          <Button type="primary" icon={<PlusOutlined />} onClick={addItem} block>
            Thêm mới
          </Button>
          <Button
            icon={<CopyOutlined />}
            disabled={!item}
            onClick={() => copyItem(selectedId)}
            block
          >
            Nhân bản
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            disabled={!item}
            onClick={() => deleteItem(selectedId)}
            block
          >
            Xóa
          </Button>
        </div>

        <div className="item-chips">
          {items.map((it, i) => (
            <Button
              key={it.id}
              size="small"
              shape="round"
              type={it.id === selectedId ? 'primary' : 'default'}
              onClick={() => selectItem(it.id)}
            >
              {i + 1}
            </Button>
          ))}
        </div>
        <p className="hint">{status}</p>
        <p className="hint">Kéo thả item ngay trên trang A4 để đổi thứ tự.</p>
      </div>

      {/* 1-6. Text chính của item */}
      <TypographyFields
        value={item}
        onChange={updateSelected}
        textLabel="Nội dung văn bản (kèm Emoji):"
        textId="text-content"
      />

      {/* 7. Kích thước khung trên preview */}
      <div className="form-group">
        <span className="form-label">Kích thước hình trên preview:</span>
        <div className="size-buttons">
          {FRAME_SIZES.map((size) => (
            <Button
              key={size.label}
              type={item && item.w === size.w && item.h === size.h ? 'primary' : 'default'}
              onClick={() => updateSelected({ w: size.w, h: size.h })}
            >
              {size.label}
            </Button>
          ))}
        </div>
        <p className="hint">
          Text sẽ nằm gọn trong khung, khung đúng kích thước thật trên khổ A4.
        </p>
      </div>

      {/* 8. Padding từng góc của item */}
      <div className="form-group full">
        <div className="pad-head">
          <span>Padding trong khung (mm):</span>
          <div className="pad-head-actions">
            <Checkbox
              checked={padLock}
              onChange={(e) => {
                setPadLock(e.target.checked)
                // Bật lại khoá thì kéo cả 4 góc về giá trị của ô "Trên"
                if (e.target.checked && item) {
                  const v = item.padTop
                  updateSelected({
                    padTop: v,
                    padRight: v,
                    padBottom: v,
                    padLeft: v,
                  })
                }
              }}
            >
              Đều 4 góc
            </Checkbox>
            <Checkbox
              checked={Boolean(item?.showPad)}
              onChange={(e) => updateSelected({ showPad: e.target.checked })}
            >
              <span className="pad-legend" />
              Hiện màu
            </Checkbox>
          </div>
        </div>
        <div className="pad-grid">
          {PAD_FIELDS.map(({ key, label }) => (
            <div className="pad-cell" key={key}>
              <span>{label}</span>
              <InputNumber
                min={0}
                max={50}
                step={0.5}
                controls={false}
                value={item?.[key] ?? 0}
                onChange={(value) => setPad(key, value)}
              />
            </div>
          ))}
        </div>
        <p className="hint">
          Padding ăn vào bên trong khung (box-sizing: border-box) nên kích thước ngoài
          của khung vẫn đúng 3 × 4 cm.
        </p>
      </div>

      {/* 9. Thành phần bên trong item - sửa chi tiết trong modal */}
      <div className="form-group full always-on">
        <span className="form-label">Thành phần trong item:</span>
        {/* Không dùng Space.Compact ở đây vì có <Upload> xen giữa các Button */}
        <div className="btn-row">
          <Button
            block
            icon={<PlusOutlined />}
            disabled={!item}
            onClick={() =>
              // Kế thừa typography của text chính cho tiện
              addElement({
                type: 'text',
                text: 'Chữ mới',
                w: 0, // 0 = tự co theo nội dung
                h: 0,
                fontFamily: item.fontFamily,
                fontSize: item.fontSize,
                bold: item.bold,
                italic: item.italic,
                underline: item.underline,
                color: item.color,
                lineHeight: item.lineHeight,
              })
            }
          >
            Chữ
          </Button>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={readImage}
            disabled={!item}
          >
            <Button block icon={<FileImageOutlined />} disabled={!item}>
              Ảnh
            </Button>
          </Upload>
        </div>
        {/* Hai nút này tác động lên thành phần đang chọn.
            Nhãn phải ghi rõ "thành phần" để không lẫn với nút Nhân bản / Xóa
            của item ở đầu panel. */}
        <div className="btn-row" style={{ marginTop: 8 }}>
          <Button
            block
            icon={<CopyOutlined />}
            disabled={!subEl}
            onClick={copyElement}
          >
            Nhân bản thành phần
          </Button>
          <Button
            block
            danger
            icon={<CloseOutlined />}
            disabled={!subEl}
            onClick={deleteElement}
          >
            Xóa thành phần
          </Button>
        </div>

        <div className="item-chips">
          <Button
            size="small"
            shape="round"
            type={selectedElId === null ? 'primary' : 'default'}
            disabled={!item}
            onClick={() => selectElement(null)}
          >
            Text chính
          </Button>
          {item?.elements.map((el, i) => (
            <Button
              key={el.id}
              size="small"
              shape="round"
              type={selectedElId === el.id ? 'primary' : 'default'}
              onClick={() => openElModal(el.id)}
            >
              {el.type === 'image' ? 'Ảnh' : 'Chữ'} {i + 1}
            </Button>
          ))}
        </div>
        <p className="hint">
          Bấm vào một thành phần bên dưới để mở bảng tùy chỉnh; Nhân bản / Xóa áp cho
          thành phần đang chọn. Kéo trực tiếp thành phần trên trang A4 để đổi vị trí.
        </p>
      </div>

      <ElementModal />
      <PresetModal open={presetOpen} onClose={() => setPresetOpen(false)} />
    </div>
  )
}
