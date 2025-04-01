// シンプルな動作確認用API
export default function handler(req, res) {
  res.status(200).json({ 
    message: 'Hello World! APIが正常に動作しています。', 
    timestamp: new Date().toISOString(),
    method: req.method,
    query: req.query
  })
} 