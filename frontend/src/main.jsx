import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- Runtime Error Overlay ---
window.onerror = function (message, source, lineno, colno, error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;color:#ff4444;padding:40px;z-index:99999;overflow:auto;font-family:monospace;';
    errorDiv.innerHTML = `
        <h1 style="color:#ff4444;margin-bottom:20px;">🚨 RUNTIME CRASH DETECTED</h1>
        <div style="background:rgba(255,0,0,0.1);padding:20px;border-radius:12px;border:1px solid #ff4444;">
            <p><strong>Message:</strong> ${message}</p>
            <p><strong>Source:</strong> ${source}</p>
            <p><strong>Line:</strong> ${lineno}:${colno}</p>
            <pre style="margin-top:20px;white-space:pre-wrap;">${error?.stack || 'No stack trace available'}</pre>
        </div>
        <button onclick="location.reload()" style="margin-top:20px;padding:12px 24px;background:#ff4444;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">RELOAD APPLICATION</button>
    `;
    document.body.appendChild(errorDiv);
};

console.log("BuildVision main.jsx reached - Starting Rendering");

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
