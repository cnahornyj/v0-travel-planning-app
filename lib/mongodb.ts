import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to environment variables")
}

const uri = process.env.MONGODB_URI

// Cached on globalThis so dev hot reloads reuse the same connection.
const globalWithMongo = globalThis as typeof globalThis & {
  _mongoConnection?: Promise<MongoClient>
}

function getClient(): Promise<MongoClient> {
  if (!globalWithMongo._mongoConnection) {
    globalWithMongo._mongoConnection = new MongoClient(uri).connect().catch((error) => {
      // Drop the rejected promise so the next request retries instead of
      // failing forever (e.g. after an Atlas cluster is paused then resumed).
      globalWithMongo._mongoConnection = undefined
      console.error("MongoDB connection failed:", error)
      throw error
    })
  }
  return globalWithMongo._mongoConnection
}

const clientPromise: PromiseLike<MongoClient> = {
  then: (onFulfilled, onRejected) => getClient().then(onFulfilled, onRejected),
}

export default clientPromise
