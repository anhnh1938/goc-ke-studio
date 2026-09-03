import PreviewStage from './components/PreviewStage'
import SettingsPanel from './components/SettingsPanel'

export default function App() {
  return (
    <div className="app-layout">
      {/* BÊN TRÁI (2/3): Khổ A4 xem trước */}
      <PreviewStage />
      {/* BÊN PHẢI (1/3): Bảng cấu hình */}
      <SettingsPanel />
    </div>
  )
}
