import { Checkbox, InputNumber, Select, Slider } from 'antd'
import { STAGE_SWATCHES } from '../constants'
import { useEditorStore } from '../store/useEditorStore'
import Swatches from './Swatches'

/* Các thiết lập áp cho cả trang A4 / vùng xem trước. */
export default function PreviewTab() {
  const page = useEditorStore((s) => s.page)
  const setPage = useEditorStore((s) => s.setPage)

  return (
    <div className="settings-grid">
      {/* 1. Mức thu phóng */}
      <div className="form-group">
        <span className="form-label">Thu phóng:</span>
        <Select
          style={{ width: '100%' }}
          value={page.zoomMode}
          onChange={(zoomMode) => setPage({ zoomMode })}
          options={[
            { value: 'auto', label: 'Tự động vừa khung' },
            { value: 'manual', label: 'Tùy chỉnh' },
          ]}
        />
      </div>

      <div className="form-group">
        <span className="form-label">
          Mức zoom:
          <span className="value-badge">{page.zoomLevel}%</span>
        </span>
        <Slider
          min={25}
          max={500}
          step={5}
          disabled={page.zoomMode === 'auto'}
          value={page.zoomLevel}
          onChange={(zoomLevel) => setPage({ zoomLevel })}
        />
      </div>

      {/* 2. Lề trang A4 */}
      <div className="form-group">
        <span className="form-label">Lề trang (mm):</span>
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          max={50}
          value={page.pageMargin}
          onChange={(v) => setPage({ pageMargin: Number(v) || 0 })}
        />
      </div>

      {/* 3. Khoảng cách giữa các item */}
      <div className="form-group">
        <span className="form-label">Khoảng cách giữa item (mm):</span>
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          max={30}
          value={page.itemGap}
          onChange={(v) => setPage({ itemGap: Number(v) || 0 })}
        />
      </div>

      {/* 4. Đường guide */}
      <div className="form-group full">
        <span className="form-label">Hiển thị:</span>
        <div className="check-row">
        <Checkbox
          checked={page.showBorder}
          onChange={(e) => setPage({ showBorder: e.target.checked })}
        >
          Viền khung (nét đứt)
        </Checkbox>
        <Checkbox
          checked={page.showCaption}
          onChange={(e) => setPage({ showCaption: e.target.checked })}
        >
          Nhãn kích thước
        </Checkbox>
        </div>
        <p className="hint">
          Đây là đường guide hỗ trợ căn chỉnh, không phải nội dung in.
        </p>
      </div>

      {/* 5. Màu nền vùng preview */}
      <div className="form-group full">
        <span className="form-label">Màu nền vùng xem trước:</span>
        <Swatches
          value={page.stageColor}
          presets={STAGE_SWATCHES}
          onChange={(stageColor) => setPage({ stageColor })}
        />
      </div>
    </div>
  )
}
