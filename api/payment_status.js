import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'payment_status.json')

  // GET: 상태 조회
  if (req.method === 'GET') {
    const data = fs.readFileSync(filePath, 'utf-8')
    return res.status(200).json(JSON.parse(data))
  }

  // PUT: 본문의 isPaid 값을 그대로 저장
  if (req.method === 'PUT') {
    // Basic Auth 확인 (생략하지 않는 경우)
    const auth = req.headers.authorization || ''
    const [scheme, credentials] = auth.split(' ')
    if (scheme !== 'Basic') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Authentication required')
    }
    const [user, pass] = Buffer.from(credentials, 'base64')
      .toString()
      .split(':')
    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Access denied')
    }

    // 요청 본문 파싱
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }
    try {
      const { isPaid } = JSON.parse(body)
      fs.writeFileSync(filePath, JSON.stringify({ isPaid }, null, 2))
      return res.status(200).json({ message: 'Payment status updated' })
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON body' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
