import { Button, Input, InputNumber, Select, Slider } from 'antd'
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  VerticalAlignBottomOutlined,
  VerticalAlignMiddleOutlined,
  VerticalAlignTopOutlined,
} from '@ant-design/icons'
import { ALIGN_OPTIONS, FONT_OPTIONS, TEXT_SWATCHES, VALIGN_OPTIONS } from '../constants'
import Swatches from './Swatches'

const ALIGN_ICONS = {
  left: <AlignLeftOutlined />,
  center: <AlignCenterOutlined />,
  right: <AlignRightOutlined />,
}

const VALIGN_ICONS = {
  top: <VerticalAlignTopOutlined />,
  middle: <VerticalAlignMiddleOutlined />,
  bottom: <VerticalAlignBottomOutlined />,
}

/* Nhóm control chữ dùng chung cho text chính của item (panel) và cho chữ con
   (modal). Render ra các .form-group nên phải đặt trong một .settings-grid.

   value  = đối tượng đang sửa (item hoặc thành phần con)
   onChange = nhận patch, thường là updateSelected / updateTarget
   showValign = hiện thêm hàng căn dọc; chỉ item có khung cao cố định mới cần */
export default function TypographyFields({
  value,
  onChange,
  textLabel,
  textId,
  showValign = false,
}) {
  return (
    <>
      <div className="form-group full">
        <label className="form-label" htmlFor={textId}>
          {textLabel}
        </label>
        <Input.TextArea
          id={textId}
          rows={5}
          placeholder="Nhập nội dung vào đây..."
          value={value?.text ?? ''}
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Chọn Font chữ (kèm Emoji iOS):</span>
        <Select
          style={{ width: '100%' }}
          options={FONT_OPTIONS}
          value={value?.fontFamily}
          onChange={(v) => onChange({ fontFamily: v })}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Kích thước chữ (px):</span>
        <InputNumber
          style={{ width: '100%' }}
          min={6}
          max={200}
          value={value?.fontSize}
          onChange={(v) => onChange({ fontSize: Number(v) || 10 })}
        />
      </div>

      <div className="form-group">
        <span className="form-label">Kiểu chữ:</span>
        <div className="btn-row tight">
          <Button
            block
            icon={<BoldOutlined />}
            type={value?.bold ? 'primary' : 'default'}
            onClick={() => onChange({ bold: !value?.bold })}
          />
          <Button
            block
            icon={<ItalicOutlined />}
            type={value?.italic ? 'primary' : 'default'}
            onClick={() => onChange({ italic: !value?.italic })}
          />
          <Button
            block
            icon={<UnderlineOutlined />}
            type={value?.underline ? 'primary' : 'default'}
            onClick={() => onChange({ underline: !value?.underline })}
          />
        </div>
      </div>

      <div className="form-group">
        <span className="form-label">Căn lề:</span>
        <div className="btn-row tight">
          {ALIGN_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              block
              title={opt.label}
              icon={ALIGN_ICONS[opt.value]}
              type={(value?.align ?? 'center') === opt.value ? 'primary' : 'default'}
              onClick={() => onChange({ align: opt.value })}
            />
          ))}
        </div>
        {showValign && (
          <div className="btn-row tight" style={{ marginTop: 8 }}>
            {VALIGN_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                block
                title={opt.label}
                icon={VALIGN_ICONS[opt.value]}
                type={(value?.valign ?? 'middle') === opt.value ? 'primary' : 'default'}
                onClick={() => onChange({ valign: opt.value })}
              />
            ))}
          </div>
        )}
      </div>

      <div className="form-group">
        <span className="form-label">Màu chữ:</span>
        <Swatches
          value={value?.color ?? '#111111'}
          presets={TEXT_SWATCHES}
          onChange={(color) => onChange({ color })}
        />
      </div>

      <div className="form-group">
        <span className="form-label">
          Độ giãn dòng:
          <span className="value-badge">
            {Number(value?.lineHeight ?? 1.5).toFixed(1)}
          </span>
        </span>
        <Slider
          min={0.8}
          max={3}
          step={0.1}
          value={Number(value?.lineHeight ?? 1.5)}
          onChange={(v) => onChange({ lineHeight: v })}
        />
      </div>
    </>
  )
}
