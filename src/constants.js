/* Hằng số dùng chung cho toàn app: đơn vị, danh sách font, màu mẫu, khung mẫu. */

export const PX_PER_MM = 96 / 25.4

export const FONT_OPTIONS = [
  { value: "'DynaPuff', 'iOSEmojiCustom', cursive", label: 'DynaPuff (Google Font)' },
  { value: "'Caveat', 'iOSEmojiCustom', cursive", label: 'Caveat (Viết tay)' },
  { value: "'Inter', 'iOSEmojiCustom', sans-serif", label: 'Inter (Hiện đại)' },
  { value: "'Roboto', 'iOSEmojiCustom', sans-serif", label: 'Roboto (Tiêu chuẩn)' },
  { value: "'Be Vietnam Pro', 'iOSEmojiCustom', sans-serif", label: 'Be Vietnam Pro (Tiếng Việt)' },
  { value: "'Merriweather', 'iOSEmojiCustom', serif", label: 'Merriweather (Có chân)' },
]

export const TEXT_SWATCHES = [
  '#111111',
  '#d32f2f',
  '#1976d2',
  '#2e7d32',
  '#f9a825',
  '#6a1b9a',
]

export const STAGE_SWATCHES = ['#525659', '#1e1e1e', '#8a8f98', '#eef1f5']

// Nhãn "3 × 4" = cao 3, rộng 4 -> w là số sau, h là số trước
export const FRAME_SIZES = [
  { label: 'Không khung', w: 0, h: 0 },
  { label: '3 × 4 cm', w: 4, h: 3 },
  { label: '3 × 5 cm', w: 5, h: 3 },
  { label: '2 × 6 cm', w: 6, h: 2 },
]

export const DEFAULT_ITEM = {
  text: 'Nội dung mới ✨',
  fontFamily: "'DynaPuff', 'iOSEmojiCustom', cursive",
  fontSize: 10,
  bold: false,
  italic: false,
  underline: false,
  color: '#111111',
  lineHeight: 1.5,
  w: 4, // rộng (cm) - 0 nghĩa là không khung
  h: 3, // cao (cm)
  padTop: 2, // padding trong khung, đơn vị mm
  padRight: 2,
  padBottom: 2,
  padLeft: 2,
  showPad: true, // tô màu vùng padding (guide, theo từng item)
  elements: [], // chữ / ảnh con đặt tự do trong item
}

export const DEFAULT_PAGE = {
  zoomMode: 'auto', // auto | manual
  zoomLevel: 100,
  pageMargin: 20, // mm
  itemGap: 5, // mm
  showBorder: true,
  showCaption: true,
  stageColor: '#525659',
}
