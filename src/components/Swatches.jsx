import { ColorPicker } from 'antd'

/* Ô chọn màu của antd + dãy màu mẫu bấm nhanh. */
export default function Swatches({ value, presets, onChange, disabled }) {
  return (
    <div className="color-row">
      <ColorPicker
        value={value}
        disabled={disabled}
        showText
        disabledAlpha
        onChange={(color) => onChange(color.toHexString())}
      />
      <div className="swatches">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            title={color}
            disabled={disabled}
            className={'swatch' + (color === value ? ' active' : '')}
            style={{ background: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
    </div>
  )
}
