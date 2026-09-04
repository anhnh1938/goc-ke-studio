/* Hằng số dùng chung cho toàn app: đơn vị, danh sách font, màu mẫu, khung mẫu. */

export const PX_PER_MM = 96 / 25.4

export const FONT_OPTIONS = [
  { value: "'Roboto', 'iOSEmojiCustom', sans-serif", label: 'Roboto (Tiêu chuẩn)' },
  { value: "'DynaPuff', 'iOSEmojiCustom', cursive", label: 'DynaPuff (Google Font)' },
  { value: "'Caveat', 'iOSEmojiCustom', cursive", label: 'Caveat (Viết tay)' },
  { value: "'Inter', 'iOSEmojiCustom', sans-serif", label: 'Inter (Hiện đại)' },
  { value: "'Be Vietnam Pro', 'iOSEmojiCustom', sans-serif", label: 'Be Vietnam Pro (Tiếng Việt)' },
  { value: "'Merriweather', 'iOSEmojiCustom', serif", label: 'Merriweather (Có chân)' },
]

/* Căn lề chữ. Khung item là flex row nên NGANG do justify-content, DỌC do
   align-items — hai bảng dưới đổi từ giá trị lưu trong item sang giá trị flex.
   Chữ con chỉ dùng được phần ngang (text-align), xem SubElement. */
export const ALIGN_OPTIONS = [
  { value: 'left', label: 'Căn trái' },
  { value: 'center', label: 'Căn giữa' },
  { value: 'right', label: 'Căn phải' },
]

export const VALIGN_OPTIONS = [
  { value: 'top', label: 'Dồn lên trên' },
  { value: 'middle', label: 'Giữa theo chiều dọc' },
  { value: 'bottom', label: 'Dồn xuống dưới' },
]

export const JUSTIFY_BY_ALIGN = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
}

export const ALIGN_ITEMS_BY_VALIGN = {
  top: 'flex-start',
  middle: 'center',
  bottom: 'flex-end',
}

export const TEXT_SWATCHES = [
  '#111111',
  '#d32f2f',
  '#1976d2',
  '#2e7d32',
  '#f9a825',
  '#6a1b9a',
]

export const STAGE_SWATCHES = ['#525659', '#1e1e1e', '#8a8f98', '#eef1f5']

/* Nhãn "3 × 4" = cao 3, rộng 4 -> w là số sau, h là số trước.
   Mỗi cỡ mang theo padding riêng (mm), tên trường giống hệt DEFAULT_ITEM để
   chọn cỡ là spread thẳng vào item được. Khung càng thấp thì chừa trên/dưới
   càng ít, nếu không phần chữ còn lại quá hẹp: khung cao 1.5 cm mà chừa 2 mm
   mỗi bên là mất luôn 27% chiều cao. */
export const FRAME_SIZES = [
  { label: 'Không khung', w: 0, h: 0, padTop: 2, padRight: 2, padBottom: 2, padLeft: 2 },
  { label: '3 × 4 cm', w: 4, h: 3, padTop: 10, padRight: 0, padBottom: 2, padLeft: 0 },
  { label: '3 × 5 cm', w: 5, h: 3, padTop: 2, padRight: 2, padBottom: 2, padLeft: 2 },
  { label: '1.5 × 6 cm', w: 6, h: 1.5, padTop: 1, padRight: 2, padBottom: 1, padLeft: 2 },
]

// Lấy phần kích thước + padding của một cỡ khung, bỏ lại label
export const frameFields = ({ w, h, padTop, padRight, padBottom, padLeft }) => ({
  w,
  h,
  padTop,
  padRight,
  padBottom,
  padLeft,
})

export const findFrameSize = (w, h) =>
  FRAME_SIZES.find((size) => size.w === w && size.h === h) || null

export const DEFAULT_ITEM = {
  text: 'Nội dung mới ✨',
  fontFamily: FONT_OPTIONS[0].value,
  fontSize: 10,
  bold: false,
  italic: false,
  underline: false,
  color: '#111111',
  lineHeight: 1.5,
  align: 'center', // giữ đúng mặc định của bản gốc: chữ nằm giữa khung
  valign: 'middle',
  ...frameFields(FRAME_SIZES[1]), // w, h và padding của cỡ 3 × 4
  showPad: true, // tô màu vùng padding (guide, theo từng item)
  elements: [], // chữ / ảnh con đặt tự do trong item
}

export const DEFAULT_PAGE = {
  zoomMode: 'auto', // auto | manual
  zoomLevel: 100,
  pageMargin: 10, // mm
  itemGap: 5, // mm
  showBorder: true,
  showCaption: true,
  stageColor: '#525659',
}
