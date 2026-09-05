import 'dotenv/config'

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`)
  }
  return value.trim()
}

export const env = {
  port: Number(process.env.PORT) || 5050,
  jwtSecret: required('JWT_SECRET', process.env.JWT_SECRET),
  // How long a login lasts, in days.
  sessionDays: Number(process.env.SESSION_DAYS) || 7,
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongodbUri: required('MONGODB_URI', process.env.MONGODB_URI),
  /**
   * Where the built frontend lives. In production one process serves both the
   * API and the site, which is what shared hosting expects.
   */
  clientDistPath: process.env.CLIENT_DIST_PATH ?? '../client/dist',
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}

export const isProduction = env.nodeEnv === 'production'
