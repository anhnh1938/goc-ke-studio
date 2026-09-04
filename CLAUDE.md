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
(`addElement`) và tự đóng khi xoá thành phần hoặc đổi sang item khác (`selectItem`) —
nếu không modal sẽ trỏ vào một thành phần không còn tồn tại.

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

**ResizeObserver chỉ quan sát `.a4-page`, tuyệt đối không quan sát vùng cuộn
`.preview-section`.** Đổi kích thước viewport làm thanh cuộn xuất hiện/biến mất → nếu
quan sát cả hai sẽ dao động vô hạn. Xem comment trong `PreviewStage.jsx`.

**Kéo thành phần con phải tắt HTML5 drag của item cha**, nếu không hai cơ chế kéo xung
đột. `SubElement` gọi `setDragLocked` do `FrameItem` truyền xuống.

**Tô màu vùng padding** dùng thủ thuật 2 lớp gradient (`.a4-text.show-padding`): lớp trắng
phủ content-box, lớp xanh phủ padding-box, phần chênh lệch chính là vùng padding.

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
