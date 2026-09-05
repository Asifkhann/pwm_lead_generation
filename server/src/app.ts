import { existsSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import routes from './routes/index.js'
import { notFoundHandler } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { env, isProduction } from './config/env.js'

/**
 * Serves the built frontend alongside the API so a deployment is a single
 * process on a single port. Any path that is not /api falls through to
 * index.html, because the routing happens in the browser.
 */
function serveClient(app: express.Express): void {
  const distPath = path.resolve(process.cwd(), env.clientDistPath)
  const indexPath = path.join(distPath, 'index.html')

  if (!existsSync(indexPath)) {
    if (isProduction) {
      console.warn(`[server] no frontend build at ${distPath} — serving the API only`)
    }
    return
  }

  // Asset filenames carry a content hash, so they can be cached indefinitely.
  app.use(
    express.static(distPath, {
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache')
      },
    }),
  )

  // index.html must never be cached, or a deploy would not reach the browser.
  app.get(/^\/(?!api\/).*/, (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexPath)
  })

  console.log(`[server] serving the frontend from ${distPath}`)
}

export function createApp() {
  const app = express()

  // Behind the Vite dev proxy (and any production proxy), req.ip should be the
  // real client address so the sign-in throttle keys on the right thing.
  app.set('trust proxy', 1)

  app.use(cors({ origin: env.clientOrigins, credentials: true }))
  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  // Minimal hardening: the API only ever returns JSON.
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Frame-Options', 'DENY')
    next()
  })

  app.use('/api', routes)

  serveClient(app)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
