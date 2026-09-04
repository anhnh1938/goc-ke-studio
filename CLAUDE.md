# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này.

## Dự án

A4 Live Editor — trình soạn thảo trực tiếp khổ giấy A4 (210 × 297 mm). Panel phải chỉnh
sửa, trang A4 bên trái cập nhật live. Hỗ trợ Google Fonts + font emoji màu local.

Đây là bản chuyển đổi từ `legacy/index.html` (HTML/CSS/JS thuần, 1 file). **Khi sửa hành
vi, đối chiếu với `legacy/index.html` trước** — nó là đặc tả gốc và mọi quyết định thiết
kế ở đây đều bắt nguồn từ nó.

Stack: Vite 5 + React 18 (JSX, không TypeScript) + Ant Design 5 + Zustand 4.

## Lệnh

```bash
npm run dev      # dev server, http://localhost:5173
npm run build    # build production vào dist/
npm run preview  # xem thử bản build
```

Không có test runner, linter hay formatter được cấu hình.

## Kiến trúc

`src/store/useEditorStore.js` là nguồn sự thật duy nhất. Component không giữ state của
dữ liệu, chỉ giữ state của UI thuần tuý (ví dụ `padLock`, `dropMark`, `dragLocked`).

Hai cấp dữ liệu:

- **item** — một khung text độc lập trên trang A4, xếp theo flex-wrap trong `.items-area`
- **element** (thành phần con) — chữ hoặc ảnh đặt tự do (absolute) bên trong một item

Selection có hai tầng: `selectedId` (item) và `selectedElId` (thành phần con, `null` =
không chọn thành phần con nào).

**Phân chia chỗ sửa:** panel bên phải (`TextTab`) chỉ sửa item và text chính của nó, luôn
dùng `updateSelected`. Thành phần con sửa trong `ElementModal`, luôn dùng `updateTarget`
(action này tự trỏ vào thành phần con đang chọn). Đừng gộp lại — bản trước dùng chung
control cho cả hai và rất khó đoán đang sửa cái gì.

`TypographyFields` là nhóm control chữ dùng chung cho cả hai chỗ; nó render ra các
`.form-group` nên phải đặt trong một `.settings-grid`.

Modal điều khiển bằng `elModalOpen` trong store. Nó tự mở khi thêm thành phần
(`addElement`) và tự đóng khi xoá thành phần hoặc đổi sang **item khác**
(`selectItem`) — nếu không modal sẽ trỏ vào một thành phần không còn tồn tại. Chọn
thành phần khác trong **cùng** item thì modal giữ nguyên và đổi nội dung sang thành
phần vừa chọn: modal không có mask nên người dùng bấm thẳng lên trang để chuyển qua
lại giữa các thành phần.

Modal này cố tình không phải modal chặn: `mask={false}`, bề rộng khớp panel bên phải,
dạt sang phải để tờ A4 luôn nhìn thấy được. Xem mục "Sửa mà không thấy" bên dưới.

## Những chỗ dễ sai

**Hệ đơn vị hỗn hợp** — cố ý, giống bản gốc, đừng "chuẩn hoá" lại:

| Thứ | Đơn vị |
| --- | --- |
| Khung item (`w`, `h`) | cm |
| Toạ độ / kích thước thành phần con (`x`, `y`, `w`, `h`) | mm |
| Padding item | mm |
| Cỡ chữ | px |

`PX_PER_MM = 96 / 25.4` trong `src/constants.js`.

**`FRAME_SIZES` mang cả padding.** Mỗi cỡ khung khai báo `w, h, padTop, padRight,
padBottom, padLeft` — cùng tên trường với `DEFAULT_ITEM` nên spread thẳng vào item được
(`frameFields()`). Chọn cỡ khung là đặt lại cả padding: khung 1.5 cm cao mà vẫn chừa 2 mm
trên/dưới thì mất 27% chiều cao, nên cỡ đó chỉ chừa 1 mm.

**`w`/`h` = 0 nghĩa là "auto", không phải 0.** Item: `w`/`h` = 0 → không có khung. Thành
phần con: `w` = 0 → chữ co theo nội dung; `h` = 0 → ảnh giữ tỉ lệ gốc.

**Căn lề đi qua flex, không chỉ `text-align`.** Item có `align` (`left|center|right`)
và `valign` (`top|middle|bottom`), mặc định `center` / `middle` để giữ đúng bản gốc.
Khung `.a4-text.framed` là flex **row** nên NGANG do `justify-content`, DỌC do
`align-items` — đổi qua `JUSTIFY_BY_ALIGN` / `ALIGN_ITEMS_BY_VALIGN` trong
`constants.js`. Giá trị center trong CSS chỉ là mặc định, `FrameItem` luôn ghi đè bằng
inline style; sửa CSS mà không sửa `FrameItem` sẽ không thấy gì thay đổi. Chữ con chỉ
có `align` (một mình `text-align`) vì hộp của nó co theo nội dung, căn dọc vô nghĩa —
`TypographyFields` nhận prop `showValign` để chỉ item mới hiện hàng căn dọc.

Lưu ý khi kiểm tra: `justify-content` thường **không** làm đổi hộp của `.a4-text-inner`
(chữ dài đã lấp hết bề ngang khả dụng), phải đo từng line box qua
`Range.getClientRects()` mới thấy các dòng dịch chỗ.

**Nhãn khung đảo thứ tự.** Nhãn "3 × 4 cm" = cao 3, rộng 4 → dữ liệu là `w: 4, h: 3`. Xem
`FRAME_SIZES` và caption trong `FrameItem.jsx`.

**Kéo thành phần con phải chia cho `scale`.** Trang A4 bị `transform: scale()`, nên delta
chuột phải chia cho `useEditorStore.getState().scale` trước khi đổi sang mm. Xem
`SubElement.jsx`.

**"Sửa mà không thấy" — ba cơ chế phải giữ cùng nhau.** Thành phần con có thể chỉ to
vài mm, nằm lẫn trong chữ chính, nên sửa xong không biết mình vừa đổi cái gì:

1. `ElementModal` bỏ mask và dạt sang phải. Bỏ mask thì **lớp wrap của antd vẫn phủ
   kín màn hình và ăn hết cú click** — `.el-modal-wrap` phải `pointer-events: none`,
   chỉ `.ant-modal` bên trong trả về `auto`.
2. Bề rộng modal là `clamp(320px, calc(33.33vw - 40px), 560px)` cho khớp panel bên
   phải. Để cứng 560px thì ở màn 1400px modal đè lên mép phải tờ A4 — đúng cái mà
   việc dạt sang phải muốn tránh.
3. `.el-modal .ant-modal-body` phải có `max-height` + `overflow-y`. Wrap đang
   `pointer-events: none` và không còn mask, nên modal cao quá màn hình là đáy nó
   (nút Xong / Xóa thành phần) tụt xuống dưới và **không có cách nào cuộn tới**.

Kèm theo: `PreviewStage` cuộn item đang chọn vào tầm nhìn (`block: 'nearest'` để không
giật khi nó đã hiện), và `.sub-el.selected` nháy 2 nhịp bằng keyframes `el-flash`.

**Lăn chuột để zoom phải gắn listener thủ công.** React đăng ký `wheel` ở dạng passive
nên `preventDefault()` trong `onWheel` không có tác dụng và trang vẫn cuộn theo — xem
`useEffect` trong `PreviewStage`. Việc neo điểm dưới con trỏ phải **hoãn tới
`updateScale`** (qua `anchorRef`), vì chỉ lúc đó `.a4-viewport` mới có kích thước mới;
công thức `(scroll + c) * ratio - c` khớp chính xác nhờ `align-items: safe center` rơi
về canh đầu khi trang lớn hơn khung.

Kéo nền để pan thì phải bỏ qua `.frame-item` (item có HTML5 drag và thành phần con có
pointer drag riêng), bỏ qua `.preview-toolbar` và `button`, và bỏ qua
`pointerType === 'touch'` — cảm ứng đã có cuộn sẵn của browser, giành lấy là phải tự lo
cả đà cuộn. Thanh cuộn của `.preview-section` bị ẩn bằng CSS chứ không phải
`overflow: hidden`: vẫn cần cuộn được.

**ResizeObserver chỉ quan sát `.a4-page`, tuyệt đối không quan sát vùng cuộn
`.preview-section`.** Đổi kích thước viewport làm thanh cuộn xuất hiện/biến mất → nếu
quan sát cả hai sẽ dao động vô hạn. Xem comment trong `PreviewStage.jsx`.

**Kéo thành phần con phải tắt HTML5 drag của item cha**, nếu không hai cơ chế kéo xung
đột. `SubElement` gọi `setDragLocked` do `FrameItem` truyền xuống.

**Tô màu vùng padding** là một lớp phủ absolute có `border` dày đúng bằng padding từng
phía (`.pad-overlay`): với phần tử absolute, `inset: 0` bám theo **padding box** của cha
nên vành border trùng khít vùng padding.

Từng làm bằng 2 lớp gradient (trắng phủ content-box + xanh phủ padding-box, lấy phần
chênh lệch). Trên màn hình giống hệt nhau, nhưng **html2canvas-pro không vẽ được nhiều
lớp background có `background-clip` khác nhau** nên ảnh xuất ra mất màu pad. Đừng đổi
về cách cũ.

## Mẫu có sẵn

`src/data/presets.json` là dữ liệu người dùng tự sửa, **không phải file sinh ra bởi code**.
Nguyên tắc: JSON viết bằng đúng từ vựng của app — `elements[]` trong đó chính là thành
phần con, tên trường y hệt lúc chạy. `presets.js` chỉ điền nốt trường bị bỏ trống, tuyệt
đối không dịch từ một cú pháp rút gọn nào sang. Từng có phiên bản dùng `hearts: [{x,y,size}]`
rồi `icons: [{icon,x,y,size}]` — cả hai đều bị bỏ vì bắt người dùng học từ vựng riêng và
khoá cứng vào emoji trái tim.

Cỡ chữ trong mẫu là số đã đo, không phải ước lượng: mỗi mẫu chỉnh sao cho dòng dài nhất
lấp ~90% bề ngang lòng khung. Lòng khung = kích thước khung trừ padding của cỡ đó trong
`FRAME_SIZES`, nên **đổi padding của một cỡ khung là làm lệch số đo của mọi mẫu dùng cỡ
đó**. Cỡ 3 × 4 cm hiện chừa 10/0/2/0 mm → lòng trong 40 × 18 mm (số cũ 36 × 26 mm ứng với
padding đều 2 mm). Đổi nội dung mẫu hoặc padding của cỡ khung thì phải đo lại, xem mục
kiểm thử bên dưới.

## Xuất ảnh / In

`src/lib/output.js`. Nút nằm trên `.preview-toolbar` (luôn thấy, không phụ thuộc tab).

**Thư viện phải là `html2canvas-pro`, đừng đổi lại.** Hai cái bẫy đã đạp phải:

- `html-to-image` / mọi hướng SVG `foreignObject` **không dùng được**: chúng bắt buộc
  nhúng webfont thành data URI, mà `public/fonts/NotoColorEmoji.ttf` nặng **33 MB**.
  `html2canvas-pro` vẽ chữ bằng canvas `fillText` nên chỉ cần font đã load trong
  document, không nhúng gì.
- `html2canvas` bản gốc dừng ở 1.4.1 (2022) và chết ngay với
  `Attempting to parse an unsupported color function "oklch"` khi computed style có
  màu dạng oklch/lab/color-mix. CSS của app không hề dùng oklch — browser mới tự trả
  về dạng đó cho một số giá trị mặc định, nên **lỗi chỉ lộ ra trên một số máy**, test
  ở Edge headless tại đây không bắt được.

Ba chỗ khác dễ sai:

- Phải truyền `width` / `height` bằng `paper.offsetWidth/offsetHeight`. Mặc định
  html2canvas đo bằng `getBoundingClientRect()`, mà `.a4-scaler` đang
  `transform: scale()` nên ảnh ra sai cỡ.
- Import động (`await import(...)`) để 250KB thư viện không nằm trong bundle khởi
  động; vite tách thành chunk riêng.
- **Phải ghi chunk `pHYs` vào file PNG.** `canvas.toBlob()` không ghi DPI, nên
  Word / Photoshop / trình xem ảnh coi ảnh là 96 dpi và in ra to gấp ~3 khổ A4,
  hoặc tự co về "vừa trang" rồi mất nét. `withPngDpi()` trong `output.js` chèn
  chunk đó (kèm CRC32 tự tính — sai CRC là file bị coi như hỏng), và ghi đè nếu
  browser đã tự ghi sẵn một chunk `pHYs`.

**Độ phân giải:** `page.exportDpi` (mặc định 300), chọn ở tab Preview qua
`EXPORT_DPI_OPTIONS`. `scale = dpi / 96` vì 1 inch = 96 px CSS. Từng để cứng
`scale: 2` = 192 dpi: nhìn trên màn thì ổn nhưng in ra nhòe, dưới mức 300 dpi tối
thiểu của in ấn. Đo thực tế: 150 → 1240 × 1754 px (0.06 MB), 300 → 2481 × 3509
(0.21 MB), 600 → 4962 × 7018 (0.72 MB, ~1.5 s).

**Nút "In" không liên quan tới `exportDpi`.** Bản in không đi qua canvas — browser
in chữ ở dạng vector nên nét theo độ phân giải máy in. Nhòe khi in chỉ đến từ ảnh
raster mà người dùng chèn vào (thành phần con dạng ảnh), hoặc từ `transform` còn
sót (đã bỏ trong `@media print`).

**Ảnh xuất ra / bản in = đúng những gì đang thấy trên preview, TRỪ phần điều khiển.**
Class `exporting` trên `<html>` chỉ ẩn cụm nút trên item, tay nắm resize và viền chọn.
Viền khung nét đứt, tô màu padding, nhãn cỡ khung thì **giữ** — chúng bật/tắt bằng
checkbox ở tab Preview và ô "Hiện màu" của từng item, tức là lựa chọn của người dùng.
Đã từng ẩn hết cho "sạch" và bị bắt lỗi: bật màu padding lên là để nó có trong ảnh.
`@media print` lặp lại các quy tắc đó để Ctrl+P trực tiếp cũng không có nút.

Hai chỗ nữa của bản in: bỏ `transform` của `.a4-scaler` và `width/height` inline của
`.a4-viewport` (cần `!important` vì JS đặt inline) để ra đúng 210 × 297 mm; và
`.a4-text.show-padding` phải có `print-color-adjust: exact` — tô padding là
`background-image`, browser bỏ hết background khi in nếu người dùng không tự bật
"Background graphics".

## Quy ước UI (antd)

**Không dùng `Space.Compact` cho hàng nút.** Nút chỉ có icon + `block` trong `Space.Compact`
không chịu co lại và sẽ tràn khỏi panel. Dùng class `.btn-row` (flex + wrap, `flex: 1 1
90px`), hoặc `.btn-row.tight` cho nhóm nút hẹp chỉ có icon (B/I/U) — chia đều, không wrap.
Cách này cũng đúng với bản gốc hơn: `legacy/index.html` dùng nút rời có gap, không dính liền.

**Nhãn nút phải nói rõ đối tượng.** Panel có hai cụm hành động lồng nhau — của item và
của thành phần con — nên nút thành phần con ghi hẳn "Nhân bản thành phần" / "Xóa thành
phần". Dùng nhãn trùng nhau ("Nhân bản" / "Xóa" cho cả hai) thì cả người dùng lẫn test
tự động đều bấm nhầm.

**Mọi `.form-group` cần `min-width: 0`** — grid item mặc định `min-width: auto` nên nội
dung rộng sẽ đẩy tràn cả panel.

**InputNumber trong `.pad-cell` phải ép `width: 100%`** — antd đặt mặc định 90px, làm lưới
4 cột tràn ở panel hẹp.

**Mobile: một `@media (max-width: 900px)` duy nhất ở cuối `src/index.css`.** Lưới đổi
sang xếp dọc — preview cao `42dvh` ở trên, panel lấy phần còn lại. Dùng `dvh` khai báo
sau `vh` (fallback) vì thanh địa chỉ của browser mobile co giãn, `100vh` đẩy đáy panel ra
ngoài màn hình. Không cần `minmax(0, 1fr)` ở đây: `.settings-section` đã có
`overflow-y: auto` nên là vùng cuộn, min-content của nó bằng 0 ở cả hai chiều (đã đo).

**Nút nổi trên trang A4 phải bù `transform: scale()`.** `.item-tools` nằm trong
`.a4-scaler` nên bị thu nhỏ theo trang: ở zoom mobile (~45%) nút 24px chỉ còn ~11px trên
màn hình. `PreviewStage` đặt biến `--inv-scale` (= 1/scale) trên `.a4-page`, media query
mobile nhân ngược lại. Nhớ neo `transform-origin: top right` và xếp nút 2 × 2 — 4 nút một
hàng sau khi bù scale rộng hơn cả item đã thu nhỏ, thò ra ngoài mép giấy rồi bị vùng cuộn
cắt mất.

**Đổi thứ tự item ở mobile dùng `moveItem(id, delta)`,** không phải kéo thả: kéo thả trên
trang là HTML5 drag, không có trên màn hình cảm ứng. Hai nút ◀ ▶ trong `.item-tools` là
đường duy nhất — cụm nút hiện cả khi item được chọn (không chỉ hover) nên chạm được.

Theme đặt `colorPrimary: '#007aff'` trong `src/main.jsx` để giữ đúng tông màu bản gốc.
Class CSS gốc (`.a4-page`, `.frame-item`, `.sub-el`, `.pad-grid`…) được giữ nguyên tên
trong `src/index.css` để dễ đối chiếu với `legacy/index.html`.

## Font

`public/fonts/NotoColorEmoji.ttf` khai báo `@font-face` tên `iOSEmojiCustom` ở đầu
`src/index.css`. Font **phải** nằm trong `public/` — Vite không phục vụ file ngoài đó.
Mọi giá trị trong `FONT_OPTIONS` đều chèn `'iOSEmojiCustom'` làm fallback thứ hai để emoji
luôn render màu.

## Kiểm thử thay đổi giao diện

Không có test tự động. Để xác minh layout thật (rất đáng làm khi đụng vào CSS panel):

```bash
npm run build
npx vite preview --port 4321 --strictPort   # chạy nền
"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless=new --disable-gpu `
  --hide-scrollbars --window-size=1100,1600 --screenshot=shot.png `
  --virtual-time-budget=6000 http://localhost:4321/
```

Kiểm tra ở **cả hai** bề rộng: ~1100px (panel 1 cột) và ~1920px (panel 2 cột) — lỗi tràn
thường chỉ lộ ra ở một trong hai.

**Đừng dùng `--window-size` để test mobile.** `--headless=new` kẹp bề rộng cửa sổ ở mức
tối thiểu (~492px) rồi vẫn cắt ảnh về đúng số đã yêu cầu: `--window-size=390,844` cho ra
ảnh 390px nhưng layout tính theo 492px, phần bị cắt trông y như lỗi tràn ngang. Đã mất
công đi tìm một bug không tồn tại vì chuyện này. Bề rộng dưới ~500px phải dùng puppeteer
với `page.setViewport({ width, height })` (đi qua CDP Emulation, không bị kẹp).

Đo tràn ngang thì so `document.documentElement.scrollWidth` với `window.innerWidth`, và
lọc phần tử có `getBoundingClientRect().right > innerWidth` để biết đúng thủ phạm.

Với logic store/DOM, có thể mount app trong jsdom rồi bắn action qua
`useEditorStore.getState()` và kiểm tra DOM. Lưu ý: `renderToString` **không** phản ánh
thay đổi của zustand (giới hạn của server snapshot), phải dùng `react-dom/client` + `act`.

**Đo chữ có tràn khung không:** đừng dùng div probe ẩn để đo — webfont chỉ được tải khi
có phần tử thật dùng đến nó, nên probe sẽ đo bằng font fallback và cho số sai lệch tới 25%.
Phải thêm item thật lên trang, `await document.fonts.ready`, rồi so bề rộng dòng dài nhất
với lòng khung. Cũng đừng đếm dòng bằng `Range.getClientRects().length` — nó trả thêm rect
cho ký tự xuống dòng, mọi mẫu đều bị báo nhầm là wrap.

Cần click thật (mở modal, kéo thả) thì `npm i --no-save puppeteer-core` rồi
`puppeteer.launch({ executablePath: <đường dẫn msedge.exe>, headless: 'new' })`. Script
phải nằm **trong** thư mục dự án, nếu không node không resolve được `node_modules`. Nhớ
chặn request `.ttf` cho nhanh, và gỡ puppeteer sau khi chạy xong.
