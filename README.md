# A4 Live Editor — React + Ant Design

Trình soạn thảo trực tiếp khổ giấy A4 (210 × 297 mm): gõ nội dung ở panel bên phải,
xem kết quả live trên tờ A4 bên trái. Hỗ trợ Google Fonts + font Emoji màu local.

Đây là bản chuyển đổi từ file `legacy/index.html` (HTML/CSS/JS thuần) sang React,
UI dựng lại bằng [Ant Design](https://ant.design).

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173/goc-ke-studio/
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
```

> Dev server chạy dưới đường dẫn `/goc-ke-studio/` vì `base` trong `vite.config.js` được
> đặt cho GitHub Pages project site. `npm run dev` tự mở đúng URL.

## Deploy

Tự động lên GitHub Pages qua [.github/workflows/deploy.yml](.github/workflows/deploy.yml):
mỗi lần push lên `main` sẽ build và publish.

URL: <https://anhnh1938.github.io/goc-ke-studio/>

Lần đầu cần bật một lần trên GitHub: **Settings → Pages → Build and deployment →
Source = GitHub Actions**.

## Công nghệ

| Thành phần   | Lựa chọn                                  |
| ------------ | ----------------------------------------- |
| Build tool   | Vite 5                                    |
| UI framework | React 18                                  |
| UI kit       | Ant Design 5 (`colorPrimary: #007aff`)    |
| State        | Zustand (một store duy nhất cho editor)   |

## Cấu trúc

```
src/
  main.jsx                  # entry, ConfigProvider + theme + locale vi_VN
  App.jsx                   # layout 2 cột: preview (2fr) | settings (1fr)
  constants.js              # đơn vị mm→px, danh sách font, màu mẫu, khung mẫu
  index.css                 # CSS gốc của trang A4 (khung, padding guide, sub-element)
  store/useEditorStore.js   # toàn bộ state + action của editor
  components/
    PreviewStage.jsx        # vùng xem trước, thu phóng, kéo thả đổi thứ tự item
    FrameItem.jsx           # một item trên trang A4
    SubElement.jsx          # chữ / ảnh con đặt tự do, kéo & resize bằng pointer event
    SettingsPanel.jsx       # panel phải, 2 tab
    TextTab.jsx             # tab Văn bản (sửa item + text chính)
    PreviewTab.jsx          # tab Preview
    ElementModal.jsx        # modal tùy chỉnh một thành phần con
    TypographyFields.jsx    # nhóm control chữ dùng chung cho panel và modal
    Swatches.jsx            # ColorPicker + dãy màu mẫu
public/
  fonts/NotoColorEmoji.ttf  # font emoji màu, khai báo @font-face là "iOSEmojiCustom"
legacy/
  index.html                # bản HTML gốc, giữ lại để đối chiếu
```

## Mô hình dữ liệu

Một **item** là một khung text độc lập trên trang A4:

```js
{
  id, text, fontFamily, fontSize, bold, italic, underline, color, lineHeight,
  w, h,                                  // kích thước khung (cm), 0 = không khung
  padTop, padRight, padBottom, padLeft,  // padding trong khung (mm)
  showPad,                               // tô màu vùng padding (guide)
  elements: []                           // chữ / ảnh con
}
```

Một **thành phần con** (`elements[]`) đặt tự do trong item:

```js
{ id, type: 'text' | 'image', x, y, w, h, rotate, z, /* text: */ text, fontFamily, ... , /* image: */ src }
```

Toạ độ và kích thước của thành phần con tính bằng **mm**, khung item tính bằng **cm**,
cỡ chữ tính bằng **px** — đúng như bản gốc.

## Tính năng

- Thêm / nhân bản / xóa item; đổi thứ tự bằng kéo thả trực tiếp trên trang A4
- Font, cỡ chữ, đậm / nghiêng / gạch chân, màu, độ giãn dòng
- Khung kích thước thật: 3×4, 3×5, 2×6 cm hoặc không khung
- Padding 4 góc (khoá đều 4 góc, tô màu vùng padding kiểu DevTools)
- Thành phần con: thêm chữ / ảnh, kéo để di chuyển, kéo ô cam để resize. Bấm vào
  thành phần trong danh sách để mở modal tùy chỉnh (nội dung, font, vị trí, xoay, lớp z)
- Thu phóng tự động vừa khung hoặc tùy chỉnh 25–200%
- Lề trang, khoảng cách item, bật/tắt đường guide, đổi màu nền vùng xem trước
