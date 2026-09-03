import { Button, InputNumber, Modal } from 'antd'
import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined } from '@ant-design/icons'
import {
  selectSelectedEl,
  selectSelectedItem,
  useEditorStore,
} from '../store/useEditorStore'
import TypographyFields from './TypographyFields'

const POS_FIELDS = [
  { key: 'x', label: 'X (trái)', step: 0.5 },
  { key: 'y', label: 'Y (trên)', step: 0.5 },
  { key: 'w', label: 'Rộng', step: 0.5, min: 0 },
  { key: 'h', label: 'Cao', step: 0.5, min: 0 },
  { key: 'rotate', label: 'Xoay (°)', step: 1 },
  { key: 'z', label: 'Lớp (z)', step: 1, min: 0, max: 99 },
]

/* Modal tùy chỉnh một thành phần con (chữ / ảnh) trong item.
   Mọi thay đổi áp ngay lên trang A4 - đóng modal không hoàn tác. */
export default function ElementModal() {
  const open = useEditorStore((s) => s.elModalOpen)
  const item = useEditorStore(selectSelectedItem)
  const subEl = useEditorStore(selectSelectedEl)
  const closeElModal = useEditorStore((s) => s.closeElModal)
  const updateTarget = useEditorStore((s) => s.updateTarget)
  const deleteElement = useEditorStore((s) => s.deleteElement)
  const restack = useEditorStore((s) => s.restack)

  // Thành phần có thể đã bị xoá trong lúc modal mở
  if (!subEl) return null

  const index = item.elements.findIndex((el) => el.id === subEl.id)
  const isImage = subEl.type === 'image'
  const title = `${isImage ? 'Ảnh' : 'Chữ'} ${index + 1}`

  return (
    <Modal
      open={open}
      onCancel={closeElModal}
      title={`Tùy chỉnh ${title.toLowerCase()}`}
      width={560}
      destroyOnClose
      footer={
        <div className="modal-footer">
          <Button danger icon={<DeleteOutlined />} onClick={deleteElement}>
            Xóa thành phần
          </Button>
          <Button type="primary" onClick={closeElModal}>
            Xong
          </Button>
        </div>
      }
    >
      <div className="settings-grid">
        {isImage ? (
          <div className="form-group full">
            <span className="form-label">Ảnh:</span>
            <img className="el-preview" src={subEl.src} alt="" />
          </div>
        ) : (
          <TypographyFields
            value={subEl}
            onChange={updateTarget}
            textLabel="Nội dung (kèm Emoji):"
            textId="el-text-content"
          />
        )}

        <div className="form-group full">
          <span className="form-label">Vị trí &amp; kích thước trong item (mm):</span>
          <div className="pad-grid">
            {POS_FIELDS.map(({ key, label, ...rest }) => (
              <div className="pad-cell" key={key}>
                <span>{label}</span>
                <InputNumber
                  {...rest}
                  controls={false}
                  value={subEl[key] ?? 0}
                  onChange={(v) => updateTarget({ [key]: Number(v) || 0 })}
                />
              </div>
            ))}
          </div>
          <p className="hint">
            Để <b>0</b> nghĩa là tự động (chữ co theo nội dung, ảnh giữ đúng tỉ lệ gốc).
            Hoặc kéo ô vuông cam ở góc dưới–phải của thành phần ngay trên trang A4.
          </p>
        </div>

        <div className="form-group full">
          <span className="form-label">Thứ tự lớp:</span>
          <div className="btn-row">
            <Button block icon={<ArrowUpOutlined />} onClick={() => restack(true)}>
              Lên trên
            </Button>
            <Button block icon={<ArrowDownOutlined />} onClick={() => restack(false)}>
              Xuống dưới
            </Button>
          </div>
          <p className="hint">
            Text chính của item nằm ở lớp 1: đặt z = 0 để chui xuống dưới, z ≥ 2 để nổi
            lên trên.
          </p>
        </div>
      </div>
    </Modal>
  )
}
