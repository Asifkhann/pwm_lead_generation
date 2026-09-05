import mongoose from 'mongoose'
import { env } from './env.js'

const connectionStates: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
}

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true)

  mongoose.connection.on('connected', () => {
    console.log(`[db] connected to "${mongoose.connection.name}"`)
  })
  mongoose.connection.on('error', (error) => {
    console.error('[db] connection error:', error instanceof Error ? error.message : error)
  })
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected')
  })

  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 10_000 })
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close()
}

export function getDatabaseStatus() {
  return {
    status: connectionStates[mongoose.connection.readyState] ?? 'unknown',
    name: mongoose.connection.name ?? null,
  }
}
