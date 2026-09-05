import { createApp } from './app.js'
import { env } from './config/env.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'

async function start() {
  // The API still boots if MongoDB is unavailable so /api/health can report it.
  try {
    await connectDatabase()
  } catch (error) {
    console.error('[db] initial connection failed:', error instanceof Error ? error.message : error)
    console.error('[db] start MongoDB (or fix MONGODB_URI in .env) and restart the server.')
  }

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`)
    console.log(`[server] health check: http://localhost:${env.port}/api/health`)
  })

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[server] port ${env.port} is already in use. Set a different PORT in .env.`)
    } else {
      console.error('[server] listen error:', error.message)
    }
    process.exit(1)
  })

  const shutdown = (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down…`)
    server.close(async () => {
      await disconnectDatabase()
      process.exit(0)
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((error) => {
  console.error('[server] failed to start:', error instanceof Error ? error.message : error)
  process.exit(1)
})
