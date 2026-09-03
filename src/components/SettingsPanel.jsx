import { Tabs } from 'antd'
import TextTab from './TextTab'
import PreviewTab from './PreviewTab'

export default function SettingsPanel() {
  return (
    <aside className="settings-section">
      <h2 className="settings-title">Tùy Chỉnh</h2>
      <Tabs
        defaultActiveKey="text"
        items={[
          { key: 'text', label: 'Văn bản', children: <TextTab /> },
          { key: 'preview', label: 'Preview', children: <PreviewTab /> },
        ]}
      />
    </aside>
  )
}
