/* Xuất ảnh PNG và in tờ A4.

   Vì sao là html2canvas-pro mà không phải html-to-image / foreignObject: hướng
   SVG bắt buộc nhúng webfont thành data URI, mà public/fonts/NotoColorEmoji.ttf
   nặng 33 MB — nhúng vào là treo máy. html2canvas-pro vẽ chữ bằng canvas
   fillText nên chỉ cần font đã load trong document, không nhúng gì cả.

   Và KHÔNG đổi về `html2canvas` bản gốc: nó dừng ở 1.4.1 (2022) và chết với lỗi
   `Attempting to parse an unsupported color function "oklch"` ngay khi computed
   style có màu dạng oklch/lab/color-mix. CSS của app không hề dùng oklch, browser
   mới tự trả về dạng đó cho một số giá trị mặc định, nên lỗi chỉ lộ ra trên một
   số máy.

   Cả hai đường đều bật class `exporting` trên <html> để ẩn phần điều khiển —
   cụm nút trên item, tay nắm resize, viền chọn. Viền khung nét đứt, tô màu
   padding và nhãn cỡ thì GIỮ: đó là lựa chọn của người dùng qua checkbox ở tab
   Preview, không phải rác của editor. Xem index.css. */

// 1 inch = 96 px CSS. Trang A4 rộng 210mm = 794 px CSS, nên scale = dpi / 96.
const CSS_DPI = 96

// Bật/tắt qua class thay vì sửa store để không ghi đè lựa chọn của người dùng.
const withCleanOutput = async (fn) => {
  const root = document.documentElement
  root.classList.add('exporting')
  try {
    return await fn()
  } finally {
    root.classList.remove('exporting')
  }
}

const stamp = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

// ---------------------------------------------------------------------------
// Ghi DPI vào file PNG (chunk pHYs)
// ---------------------------------------------------------------------------
/* canvas.toBlob() không ghi DPI, nên phần mềm in coi ảnh là 96 dpi và in ra to
   gấp ~3 lần khổ A4 (hoặc tự co về "vừa trang" rồi mất nét). Chèn chunk pHYs để
   Word / Photoshop / trình xem ảnh biết đây là ảnh 300 dpi đúng khổ A4. */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
})()

const crc32 = (bytes) => {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

// Đi qua danh sách chunk, trả về offset của chunk cần tìm (-1 nếu không có)
const findChunk = (buf, type) => {
  let p = 8 // bỏ qua 8 byte signature
  while (p + 8 <= buf.length) {
    const len = new DataView(buf.buffer, buf.byteOffset + p, 4).getUint32(0)
    const t = String.fromCharCode(buf[p + 4], buf[p + 5], buf[p + 6], buf[p + 7])
    if (t === type) return p
    if (t === 'IEND') break
    p += 12 + len // 4 length + 4 type + data + 4 crc
  }
  return -1
}

// data của pHYs: 4 byte px/đơn vị theo X, 4 byte theo Y, 1 byte đơn vị (1 = mét)
const physData = (dpi) => {
  const ppm = Math.round(dpi / 0.0254)
  const data = new Uint8Array(9)
  const view = new DataView(data.buffer)
  view.setUint32(0, ppm)
  view.setUint32(4, ppm)
  data[8] = 1
  return data
}

async function withPngDpi(blob, dpi) {
  const buf = new Uint8Array(await blob.arrayBuffer())
  const data = physData(dpi)
  const at = findChunk(buf, 'pHYs')

  // Đã có pHYs (một số browser tự ghi) -> ghi đè data + crc tại chỗ
  if (at !== -1) {
    buf.set(data, at + 8)
    new DataView(buf.buffer, buf.byteOffset).setUint32(
      at + 8 + 9,
      crc32(buf.subarray(at + 4, at + 8 + 9))
    )
    return new Blob([buf], { type: 'image/png' })
  }

  // Chưa có -> chèn ngay sau IHDR (luôn là chunk đầu, dài cố định 25 byte)
  const chunk = new Uint8Array(21)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4) // 'pHYs'
  chunk.set(data, 8)
  view.setUint32(17, crc32(chunk.subarray(4, 17)))

  const ihdrEnd = 8 + 25
  const out = new Uint8Array(buf.length + chunk.length)
  out.set(buf.subarray(0, ihdrEnd), 0)
  out.set(chunk, ihdrEnd)
  out.set(buf.subarray(ihdrEnd), ihdrEnd + chunk.length)
  return new Blob([out], { type: 'image/png' })
}

// ---------------------------------------------------------------------------

/* paper = node .a4-page. dpi mặc định 300 — mức tối thiểu của in ấn; 192 dpi
   (scale 2) nhìn trên màn thì ổn nhưng in ra nhòe. */
export async function exportPagePng(paper, dpi = 300) {
  if (!paper) return
  // Nạp động: ~250KB, không nên nằm trong bundle khởi động
  const { default: html2canvas } = await import('html2canvas-pro')

  return withCleanOutput(async () => {
    const canvas = await html2canvas(paper, {
      backgroundColor: '#ffffff',
      scale: dpi / CSS_DPI,
      // offsetWidth/Height không bị transform: scale() của .a4-scaler ảnh hưởng,
      // còn getBoundingClientRect (mặc định của html2canvas) thì bị -> ảnh sai cỡ.
      width: paper.offsetWidth,
      height: paper.offsetHeight,
      windowWidth: paper.offsetWidth,
      windowHeight: paper.offsetHeight,
      useCORS: true,
    })

    const raw = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!raw) throw new Error('canvas không tạo được ảnh')
    const blob = await withPngDpi(raw, dpi)

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `a4-${stamp()}-${dpi}dpi.png`
    a.click()
    // Thu hồi ngay sau click có thể huỷ luôn lượt tải ở một số browser
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return { width: canvas.width, height: canvas.height, bytes: blob.size }
  })
}

/* In: @media print trong index.css lo phần bỏ scale + ẩn panel, ở đây chỉ cần
   ẩn phần điều khiển. Bản in KHÔNG đi qua canvas — browser in chữ ở dạng vector
   nên nét theo đúng độ phân giải máy in, không liên quan tới dpi của xuất ảnh.
   Chrome chặn luồng ở window.print() nên finally chạy sau khi đóng hộp thoại;
   afterprint là lưới an toàn cho browser trả về ngay. */
export function printPage() {
  return withCleanOutput(
    () =>
      new Promise((resolve) => {
        const done = () => {
          window.removeEventListener('afterprint', done)
          resolve()
        }
        window.addEventListener('afterprint', done)
        window.print()
        setTimeout(done, 0)
      })
  )
}
