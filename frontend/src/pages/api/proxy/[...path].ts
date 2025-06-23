// frontend/pages/api/proxy/[...path].ts (FULL PROXY LOGIC - Logs Removed)
import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';
import { parse } from 'url';
import http from 'http'; // For type checking ServerResponse

export const config = {
  api: {
    bodyParser: false, // Let the proxy handle the body
    externalResolver: true, // Indicates that this route is handled by an external resolver like http-proxy
  },
};

const PROXY_TARGET = process.env.BACKEND_API_URL || process.env.BACKEND_URL || 
                    (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : '');

const proxy = httpProxy.createProxyServer({
  target: PROXY_TARGET,
  changeOrigin: true,    // Important for an actual backend on a different domain/port
  selfHandleResponse: false, // Let http-proxy handle the response streaming back to client
});

// Forward Authorization header
proxy.on('proxyReq', (proxyReq, req, res, options) => {
  if (req.headers['authorization']) {
    proxyReq.setHeader('authorization', req.headers['authorization']);
  }
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('[PROXY ERROR] Proxying error:', err);
  if (res instanceof http.ServerResponse) {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
    }
    // End the response stream if it's still writable
    if (res.writable && !res.writableEnded) {
        res.end('Proxy error: Could not connect to backend service.');
    } else if (res.socket && !res.socket.destroyed) {
        // If response not writable but socket open, destroy socket
        res.socket.destroy();
    }
  }
  // If not an instance of ServerResponse, it's harder to know what to do.
  // http-proxy might have already handled or attempted to handle it.
});

const proxyHandler = (req: NextApiRequest, res: NextApiResponse) => {
  const originalUrl = req.url; // For logging
  const rewrittenPath = originalUrl?.replace(/^\/api\/proxy/, '/api') || '';
  req.url = rewrittenPath; // This is what http-proxy will use

  proxy.web(req, res, {}); // Options are set on the proxy instance
};

export default proxyHandler; 
