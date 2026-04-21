import React from 'react'
import ReactDOM from 'react-dom/client'
import KnitspeedPortal from './StockPortal.jsx'
import AuthSmokeTest from './AuthSmokeTest.jsx'
import './index.css'
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthSmokeTest />
    {/* <KnitspeedPortal /> */}
  </React.StrictMode>,
)
