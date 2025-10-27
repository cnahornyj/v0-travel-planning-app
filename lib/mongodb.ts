import { MongoClient } from "mongodb"

if (!process.env.MONGODB_URI) {
  console.error("[v0] MONGODB_URI is not defined in environment variables")
  throw new Error("Please add your MONGODB_URI to environment variables")
}

const uri = process.env.MONGODB_URI
const options = {}

console.log("[v0] MongoDB URI configured:", uri.substring(0, 20) + "...")

let client: MongoClient
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable to preserve the client across hot reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    console.log("[v0] Creating new MongoDB client (development)")
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client
      .connect()
      .then((client) => {
        console.log("[v0] MongoDB connected successfully (development)")
        return client
      })
      .catch((error) => {
        console.error("[v0] MongoDB connection failed (development):", error)
        throw error
      })
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, create a new client
  console.log("[v0] Creating new MongoDB client (production)")
  client = new MongoClient(uri, options)
  clientPromise = client
    .connect()
    .then((client) => {
      console.log("[v0] MongoDB connected successfully (production)")
      return client
    })
    .catch((error) => {
      console.error("[v0] MongoDB connection failed (production):", error)
      console.error("[v0] Connection error details:", {
        name: error.name,
        message: error.message,
        code: error.code,
      })
      throw error
    })
}

export default clientPromise
