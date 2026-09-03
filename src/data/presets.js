import raw from './presets.json'

/* Đọc presets.json rồi trả về danh sách mẫu cho app.

   presets.json viết thẳng bằng đúng cấu trúc của app: mỗi phần tử trong
   "elements" chính là một thành phần con, tên trường y hệt lúc chạy. Ở đây
   chỉ điền nốt những trường bị bỏ trống, không dịch qua lại gì cả. */

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
}

export const PRESETS = raw.presets.map((preset) => {
  const item = {
    text: preset.text,
    fontSize: preset.fontSize,
    lineHeight: preset.lineHeight ?? raw.defaults.lineHeight,
    fontFamily: preset.fontFamily ?? raw.defaults.fontFamily,
    w: preset.w ?? raw.defaults.w,
    h: preset.h ?? raw.defaults.h,
  }
  item.elements = (preset.elements || []).map((el) => ({
    ...ELEMENT_DEFAULTS,
    fontFamily: item.fontFamily, // không ghi font thì dùng font của mẫu
    ...el,
  }))
  return { id: preset.id, item }
})
