import { NextApiRequest, NextApiResponse } from 'next';
import httpProxy from 'http-proxy';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const proxy = httpProxy.createProxyServer();

export default (req: NextApiRequest, res: NextApiResponse) => {
  // Forward all headers, including Authorization
  proxy.web(req, res, {
    target: 'http://localhost:8000',
    changeOrigin: true,
    selfHandleResponse: false,
  });
}; 