import { create } from 'zustand'
import { DEFAULT_ITEM, DEFAULT_PAGE } from '../constants'

/* =========================================================
   Toàn bộ trạng thái của editor nằm ở đây.
   - items: mỗi item là một khung text độc lập trên trang A4
   - selectedId / selectedElId: item và thành phần con đang sửa
   - page: các thiết lập áp cho cả trang (tab Preview)
   - scale: hệ số zoom thực tế, cần cho thao tác kéo thành phần con
   ========================================================= */

let nextId = 1
let nextElId = 1

export function createItem(preset) {
  const item = { ...DEFAULT_ITEM, ...preset, id: nextId++ }
  // elements phải là mảng riêng, không dùng chung tham chiếu với DEFAULT_ITEM
  item.elements = (preset?.elements || []).map((el) => ({ ...el, id: nextElId++ }))
  return item
}

// Đổi 1 item trong mảng theo cách bất biến
const mapItem = (items, id, fn) => items.map((it) => (it.id === id ? fn(it) : it))

const firstItem = createItem({
  text: 'Gõ nội dung vào ô bên phải để xem kết quả live trên tờ A4... 🚀🔥✨',
})

export const useEditorStore = create((set, get) => ({
  items: [firstItem],
  selectedId: firstItem.id,
  selectedElId: null,
  page: { ...DEFAULT_PAGE },
  scale: 1,

  // ---------- CHỌN ----------
  selectItem: (id, elId = null) => set({ selectedId: id, selectedElId: elId }),
  selectElement: (elId) => set({ selectedElId: elId }),

  // ---------- THÊM / NHÂN BẢN / XÓA ITEM ----------
  addItem: () =>
    set((s) => {
      const item = createItem()
      return { items: [...s.items, item], selectedId: item.id, selectedElId: null }
    }),

  copyItem: (id) =>
    set((s) => {
      const index = s.items.findIndex((it) => it.id === id)
      if (index === -1) return s
      const clone = createItem({ ...s.items[index] })
      const items = [...s.items]
      items.splice(index + 1, 0, clone)
      return { items, selectedId: clone.id, selectedElId: null }
    }),

  deleteItem: (id) =>
    set((s) => {
      const index = s.items.findIndex((it) => it.id === id)
      if (index === -1) return s
      const items = s.items.filter((it) => it.id !== id)
      if (s.selectedId !== id) return { items }
      const next = items[index] || items[index - 1]
      return { items, selectedId: next ? next.id : null, selectedElId: null }
    }),

  // ---------- SẮP XẾP ----------
  moveSelected: (delta) =>
    set((s) => {
      const index = s.items.findIndex((it) => it.id === s.selectedId)
      const target = index + delta
      if (index === -1 || target < 0 || target >= s.items.length) return s
      const items = [...s.items]
      const [item] = items.splice(index, 1)
      items.splice(target, 0, item)
      return { items }
    }),

  // Kéo thả trên trang A4: thả item dragId trước/sau item targetId
  reorder: (dragId, targetId, after) =>
    set((s) => {
      const from = s.items.findIndex((it) => it.id === dragId)
      if (from === -1 || dragId === targetId) return s
      const items = [...s.items]
      const [item] = items.splice(from, 1)
      let to = items.findIndex((it) => it.id === targetId)
      if (to === -1) return s
      if (after) to += 1
      items.splice(to, 0, item)
      return { items, selectedId: item.id }
    }),

  // ---------- SỬA ----------
  // Sửa item đang chọn
  updateSelected: (patch) =>
    set((s) =>
      s.selectedId === null
        ? s
        : { items: mapItem(s.items, s.selectedId, (it) => ({ ...it, ...patch })) }
    ),

  // Sửa thứ đang được chọn: thành phần con nếu có, không thì text chính của item
  updateTarget: (patch) =>
    set((s) => {
      if (s.selectedId === null) return s
      if (s.selectedElId === null) {
        return { items: mapItem(s.items, s.selectedId, (it) => ({ ...it, ...patch })) }
      }
      return {
        items: mapItem(s.items, s.selectedId, (it) => ({
          ...it,
          elements: it.elements.map((el) =>
            el.id === s.selectedElId ? { ...el, ...patch } : el
          ),
        })),
      }
    }),

  // Sửa trực tiếp 1 thành phần con theo id (dùng khi kéo / resize)
  patchElement: (itemId, elId, patch) =>
    set((s) => ({
      items: mapItem(s.items, itemId, (it) => ({
        ...it,
        elements: it.elements.map((el) => (el.id === elId ? { ...el, ...patch } : el)),
      })),
    })),

  // ---------- THÀNH PHẦN CON ----------
  addElement: (data) =>
    set((s) => {
      const item = s.items.find((it) => it.id === s.selectedId)
      if (!item) return s
      // z mặc định = cao hơn mọi thành phần đang có -> cái thêm sau nằm trên cùng
      const topZ = item.elements.reduce((max, el) => Math.max(max, el.z ?? 2), 1)
      const el = { id: nextElId++, x: 2, y: 2, rotate: 0, z: topZ + 1, ...data }
      return {
        items: mapItem(s.items, item.id, (it) => ({
          ...it,
          elements: [...it.elements, el],
        })),
        selectedElId: el.id,
      }
    }),

  deleteElement: () =>
    set((s) => {
      if (s.selectedId === null || s.selectedElId === null) return s
      return {
        items: mapItem(s.items, s.selectedId, (it) => ({
          ...it,
          elements: it.elements.filter((el) => el.id !== s.selectedElId),
        })),
        selectedElId: null,
      }
    }),

  // Đưa lên trên cùng / xuống dưới cùng so với các thành phần khác trong item
  restack: (toFront) =>
    set((s) => {
      const item = s.items.find((it) => it.id === s.selectedId)
      if (!item || s.selectedElId === null) return s
      const zs = item.elements.map((el) => el.z ?? 2)
      const z = toFront ? Math.max(...zs) + 1 : Math.max(0, Math.min(...zs) - 1)
      return {
        items: mapItem(s.items, item.id, (it) => ({
          ...it,
          elements: it.elements.map((el) =>
            el.id === s.selectedElId ? { ...el, z } : el
          ),
        })),
      }
    }),

  // ---------- TRANG ----------
  setPage: (patch) => set((s) => ({ page: { ...s.page, ...patch } })),

  setScale: (scale) => {
    if (Math.abs(get().scale - scale) > 1e-6) set({ scale })
  },
}))

// ---------- SELECTOR TIỆN DỤNG ----------
export const selectSelectedItem = (s) =>
  s.items.find((it) => it.id === s.selectedId) || null

export const selectSelectedEl = (s) => {
  const item = selectSelectedItem(s)
  if (!item || s.selectedElId === null) return null
  return item.elements.find((el) => el.id === s.selectedElId) || null
}

// Đối tượng mà các control chữ đang tác động: thành phần con, hoặc text chính
export const selectTarget = (s) => selectSelectedEl(s) || selectSelectedItem(s)
