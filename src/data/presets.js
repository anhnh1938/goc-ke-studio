import raw from './presets.json'
import { DEFAULT_ITEM, findFrameSize, frameFields } from '../constants'

/* Đọc presets.json rồi trả về danh sách mẫu cho app.

   presets.json viết thẳng bằng đúng cấu trúc của app: mỗi phần tử trong
   "elements" chính là một thành phần con, tên trường y hệt lúc chạy. Ở đây
   chỉ điền nốt những trường bị bỏ trống, không dịch qua lại gì cả. */

const PAD_KEYS = ['padTop', 'padRight', 'padBottom', 'padLeft']

const padsOf = (src) => Object.fromEntries(PAD_KEYS.map((k) => [k, src[k]]))

// Chỉ lấy những khoá thực sự có mặt, để không ghi đè bằng undefined
const pick = (src, keys) =>
  Object.fromEntries(keys.filter((k) => src[k] != null).map((k) => [k, src[k]]))

const ELEMENT_DEFAULTS = {
  type: 'text',
  text: '',
  x: 0,
  y: 0,
  w: 0, // 0 = tự co theo nội dung
  h: 0, // 0 = ảnh giữ tỉ lệ gốc
  rotate: 0,
  z: 2, // text chính của item nằm ở lớp 1
  fontSize: 10,
  bold: false,
  italic: false,
  underline: false,
  color: '#111111', // emoji màu bỏ qua trường này
  lineHeight: 1,
  align: 'center',
}

export const PRESETS = raw.presets.map((preset) => {
  const w = preset.w ?? raw.defaults.w
  const h = preset.h ?? raw.defaults.h
  // Padding mặc định lấy theo cỡ khung trong FRAME_SIZES, mẫu ghi đè được
  const frame = findFrameSize(w, h)
  const item = {
    ...(frame ? frameFields(frame) : { w, h, ...padsOf(DEFAULT_ITEM) }),
    text: preset.text,
    fontSize: preset.fontSize,
    lineHeight: preset.lineHeight ?? raw.defaults.lineHeight,
    fontFamily: preset.fontFamily ?? raw.defaults.fontFamily,
    ...pick(preset, [
      'padTop',
      'padRight',
      'padBottom',
      'padLeft',
      'align',
      'valign',
    ]),
  }
  item.elements = (preset.elements || []).map((el) => ({
    ...ELEMENT_DEFAULTS,
    fontFamily: item.fontFamily, // không ghi font thì dùng font của mẫu
    ...el,
  }))
  return { id: preset.id, item }
})
