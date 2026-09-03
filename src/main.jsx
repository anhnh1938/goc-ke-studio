import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntApp } from 'antd'
import viVN from 'antd/locale/vi_VN'
import App from './App.jsx'
import './index.css'

// Giữ đúng tông xanh #007aff của bản HTML gốc
const theme = {
  token: {
    colorPrimary: '#007aff',
    borderRadius: 6,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={viVN} theme={theme}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>
)
