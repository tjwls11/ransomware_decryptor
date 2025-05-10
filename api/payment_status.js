import fs from 'fs'
import path from 'path'

export default function handler(req, res) {
  const auth = req.headers.authorization || ''
  const [scheme, credentials] = auth.split(' ')
  if (scheme !== 'Basic') {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
    return res.status(401).end('Authentication required')
  }
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':')
  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Admin API"')
    return res.status(401).end('Access denied')
  }

  const filePath = path.join(process.cwd(), 'payment_status.json')
  if (req.method === 'GET') {
    const data = fs.readFileSync(filePath, 'utf-8')
    return res.status(200).json(JSON.parse(data))
  }
  if (req.method === 'PUT') {
    fs.writeFileSync(filePath, JSON.stringify({ isPaid: true }, null, 2))
    return res.status(200).json({ message: 'Payment status updated' })
  }
  res.setHeader('Allow', ['GET', 'PUT'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
