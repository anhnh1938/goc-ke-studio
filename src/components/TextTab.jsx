import { useState } from 'react'
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Select,
  Slider,
  Upload,
} from 'antd'
import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BoldOutlined,
  CloseOutlined,
  CopyOutlined,
  FileImageOutlined,
  ItalicOutlined,
  PlusOutlined,
  UnderlineOutlined,
} from '@ant-design/icons'
import { FONT_OPTIONS, FRAME_SIZES, TEXT_SWATCHES } from '../constants'
import {
  selectSelectedEl,
  selectSelectedItem,
  useEditorStore,
} from '../store/useEditorStore'
import Swatches from './Swatches'

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
  const moveSelected = useEditorStore((s) => s.moveSelected)
  const selectItem = useEditorStore((s) => s.selectItem)
  const selectElement = useEditorStore((s) => s.selectElement)
  const updateSelected = useEditorStore((s) => s.updateSelected)
  const updateTarget = useEditorStore((s) => s.updateTarget)
  const addElement = useEditorStore((s) => s.addElement)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const restack = useEditorStore((s) => s.restack)

  const [padLock, setPadLock] = useState(false)

  const index = items.findIndex((it) => it.id === selectedId)
  const isImage = subEl?.type === 'image'
  // Đối tượng mà các control chữ đang tác động
  const typo = isImage ? item : subEl || item

  const status = items.length
    ? item
      ? `Đang sửa item ${index + 1} / ${items.length} → ${
          subEl ? (isImage ? 'ảnh con' : 'chữ con') : 'text chính'
        }`
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

  const panelClass = [
    'settings-grid',
    item ? '' : 'locked',
    isImage ? 'img-mode' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={panelClass}>
      {/* 0. Quản lý item */}
      <div className="form-group full always-on">
        <span className="form-label">Item trên trang:</span>
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
        <div className="btn-row" style={{ marginTop: 8 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            disabled={!item || index <= 0}
            onClick={() => moveSelected(-1)}
            block
          >
            Lùi
          </Button>
          <Button
            disabled={!item || index === items.length - 1}
            onClick={() => moveSelected(1)}
            block
          >
            Tiến <ArrowRightOutlined />
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
        <p className="hint">Có thể kéo thả item ngay trên trang A4 để đổi thứ tự.</p>
      </div>

      {/* 1. Nội dung văn bản */}
      <div className="form-group full typo">
        <label className="form-label" htmlFor="text-content">
          Nội dung văn bản (kèm Emoji):
        </label>
        <Input.TextArea
          id="text-content"
          rows={5}
          placeholder="Nhập nội dung vào đây..."
          value={typo?.text ?? ''}
          onChange={(e) => updateTarget({ text: e.target.value })}
        />
      </div>

      {/* 2. Chọn font chữ */}
      <div className="form-group typo">
        <span className="form-label">Chọn Font chữ (kèm Emoji iOS):</span>
        <Select
          style={{ width: '100%' }}
          options={FONT_OPTIONS}
          value={typo?.fontFamily}
          onChange={(value) => updateTarget({ fontFamily: value })}
        />
      </div>

      {/* 3. Kích thước chữ */}
      <div className="form-group typo">
        <span className="form-label">Kích thước chữ (px):</span>
        <InputNumber
          style={{ width: '100%' }}
          min={6}
          max={200}
          value={typo?.fontSize}
          onChange={(value) => updateTarget({ fontSize: Number(value) || 10 })}
        />
      </div>

      {/* 4. Đậm / Nghiêng / Gạch chân */}
      <div className="form-group typo">
        <span className="form-label">Kiểu chữ:</span>
        <div className="btn-row tight">
          <Button
            block
            icon={<BoldOutlined />}
            type={typo?.bold ? 'primary' : 'default'}
            onClick={() => updateTarget({ bold: !typo?.bold })}
          />
          <Button
            block
            icon={<ItalicOutlined />}
            type={typo?.italic ? 'primary' : 'default'}
            onClick={() => updateTarget({ italic: !typo?.italic })}
          />
          <Button
            block
            icon={<UnderlineOutlined />}
            type={typo?.underline ? 'primary' : 'default'}
            onClick={() => updateTarget({ underline: !typo?.underline })}
          />
        </div>
      </div>

      {/* 5. Màu chữ */}
      <div className="form-group typo">
        <span className="form-label">Màu chữ:</span>
        <Swatches
          value={typo?.color ?? '#111111'}
          presets={TEXT_SWATCHES}
          onChange={(color) => updateTarget({ color })}
        />
      </div>

      {/* 6. Độ giãn dòng */}
      <div className="form-group typo">
        <span className="form-label">
          Độ giãn dòng:
          <span className="value-badge">
            {Number(typo?.lineHeight ?? 1.5).toFixed(1)}
          </span>
        </span>
        <Slider
          min={0.8}
          max={3}
          step={0.1}
          value={Number(typo?.lineHeight ?? 1.5)}
          onChange={(value) => updateTarget({ lineHeight: value })}
        />
      </div>

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

      {/* 9. Thành phần bên trong item */}
      <div className="form-group full always-on">
        <span className="form-label">Thành phần trong item:</span>
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <Button
            block
            icon={<ArrowUpOutlined />}
            disabled={!subEl}
            onClick={() => restack(true)}
          >
            Lên trên
          </Button>
          <Button
            block
            icon={<ArrowDownOutlined />}
            disabled={!subEl}
            onClick={() => restack(false)}
          >
            Xuống dưới
          </Button>
        </div>
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
          <Button block danger disabled={!subEl} onClick={deleteElement}>
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
              onClick={() => selectElement(el.id)}
            >
              {el.type === 'image' ? 'Ảnh' : 'Chữ'} {i + 1}
            </Button>
          ))}
        </div>
        <p className="hint">
          Kéo trực tiếp thành phần trên trang để đổi vị trí trong item.
        </p>
      </div>

      {/* 10. Vị trí / kích thước của thành phần con */}
      <div className={'form-group full' + (subEl ? '' : ' dimmed')}>
        <span className="form-label">Vị trí trong item (mm):</span>
        <div className="pad-grid">
          {[
            { key: 'x', label: 'X (trái)', step: 0.5 },
            { key: 'y', label: 'Y (trên)', step: 0.5 },
            { key: 'w', label: 'Rộng', step: 0.5, min: 0 },
            { key: 'h', label: 'Cao', step: 0.5, min: 0 },
            { key: 'rotate', label: 'Xoay (°)', step: 1 },
            { key: 'z', label: 'Lớp (z)', step: 1, min: 0, max: 99 },
          ].map(({ key, label, ...rest }) => (
            <div className="pad-cell" key={key}>
              <span>{label}</span>
              <InputNumber
                {...rest}
                controls={false}
                value={subEl ? subEl[key] ?? 0 : 0}
                onChange={(value) => updateTarget({ [key]: Number(value) || 0 })}
              />
            </div>
          ))}
        </div>
        <p className="hint">
          Chỉ áp dụng cho chữ / ảnh con. Để <b>0</b> nghĩa là tự động (chữ co theo nội
          dung, ảnh giữ đúng tỉ lệ gốc). Hoặc kéo ô vuông cam ở góc dưới–phải của thành
          phần để chỉnh trực tiếp.
        </p>
      </div>
    </div>
  )
}
