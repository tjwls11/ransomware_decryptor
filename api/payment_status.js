import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const filePath = path.join(process.cwd(), 'payment_status.json')

  if (req.method === 'GET') {
    const data = fs.readFileSync(filePath, 'utf-8')
    return res.status(200).json(JSON.parse(data))
  }

  if (req.method === 'PUT') {
    const auth = req.headers.authorization || ''
    const [scheme, creds] = auth.split(' ')
    if (scheme !== 'Basic') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Auth required')
    }
    const [user, pass] = Buffer.from(creds, 'base64').toString().split(':')
    if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
      return res.status(401).end('Access denied')
    }

    let body = ''
    for await (const chunk of req) body += chunk
    try {
      const { isPaid } = JSON.parse(body)
      fs.writeFileSync(filePath, JSON.stringify({ isPaid }, null, 2))
      return res.status(200).json({ message: 'Payment status updated' })
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
