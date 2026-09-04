/* Xuất ảnh PNG và in tờ A4.

   Vì sao là html2canvas mà không phải html-to-image / foreignObject: hướng SVG
   bắt buộc nhúng webfont thành data URI, mà public/fonts/NotoColorEmoji.ttf nặng
   33 MB — nhúng vào là treo máy. html2canvas vẽ chữ bằng canvas fillText nên chỉ
   cần font đã load trong document, không nhúng gì cả.

   Dùng html2canvas-pro, KHÔNG phải html2canvas: bản gốc dừng ở 1.4.1 (2022) và
   chết với lỗi `Attempting to parse an unsupported color function "oklch"` ngay
   khi computed style có màu dạng oklch/lab/color-mix — browser mới trả về những
   dạng này cho một số giá trị mặc định. CSS của app không hề dùng oklch, nên lỗi
   chỉ lộ ra trên một số máy: đừng đổi lại về html2canvas.

   Cả hai đường đều bật class `exporting` trên <html> để tắt guide (tô padding,
   viền nét đứt, nhãn cỡ, viền chọn, cụm nút) — xem index.css. */

// Guide chỉ là phương tiện căn chỉnh; bật/tắt qua class thay vì sửa store để
// không lọt vào undo/redo hay ghi đè lựa chọn của người dùng.
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

/* paper = node .a4-page. scale 2 cho ảnh nét gấp đôi (A4 ở 96dpi × 2 ≈ 192dpi). */
export async function exportPagePng(paper, scale = 2) {
  if (!paper) return
  // Nạp động: ~200KB, không nên nằm trong bundle khởi động
  const { default: html2canvas } = await import('html2canvas-pro')

  return withCleanOutput(async () => {
    const canvas = await html2canvas(paper, {
      backgroundColor: '#ffffff',
      scale,
      // offsetWidth/Height không bị transform: scale() của .a4-scaler ảnh hưởng,
      // còn getBoundingClientRect (mặc định của html2canvas) thì bị -> ảnh sai cỡ.
      width: paper.offsetWidth,
      height: paper.offsetHeight,
      windowWidth: paper.offsetWidth,
      windowHeight: paper.offsetHeight,
      useCORS: true,
    })

    const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'))
    if (!blob) throw new Error('canvas không tạo được ảnh')

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `a4-${stamp()}.png`
    a.click()
    // Thu hồi ngay sau click có thể huỷ luôn lượt tải ở một số browser
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    return { width: canvas.width, height: canvas.height }
  })
}

/* In: @media print trong index.css lo phần bỏ scale + ẩn panel, ở đây chỉ cần
   tắt guide. Chrome chặn luồng ở window.print() nên finally chạy sau khi đóng
   hộp thoại; onafterprint là lưới an toàn cho browser trả về ngay. */
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
        // Browser nào không bắn afterprint thì vẫn nhả class ra sau một nhịp
        setTimeout(done, 0)
      })
  )
}
