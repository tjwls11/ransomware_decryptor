import fs from 'fs'
import path from 'path'

let isPaid = false

export default async function handler(req, res) {
  const auth = req.headers.authorization || ''

  // GET: 상태 조회
  if (req.method === 'GET') {
    return res.status(200).json({ isPaid })
  }

  // PUT: JSON body 파싱 및 isPaid 업데이트
  if (req.method === 'PUT') {
    // Basic Auth 확인
    const [scheme, creds] = auth.split(' ')
    if (scheme !== 'Basic') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Authentication required')
    }
    const [user, pass] = Buffer.from(creds, 'base64').toString().split(':')
    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Access denied')
    }

    // 본문 데이터 수신
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
    })
    await new Promise((resolve) => req.on('end', resolve))

    try {
      const data = JSON.parse(body)
      if (typeof data.isPaid === 'boolean') {
        isPaid = data.isPaid
        return res.status(200).json({ message: 'Payment status updated' })
      }
      throw new Error('Invalid type')
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
