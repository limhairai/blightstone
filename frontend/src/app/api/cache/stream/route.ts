import { NextRequest } from 'next/server'

// Store active connections
const connections = new Set<ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  // Create a TransformStream for Server-Sent Events
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()
  const controller = stream.readable.getReader()

  // Add this connection to our set
  const encoder = new TextEncoder()

  // Keep connection alive
  const keepAlive = setInterval(() => {
    try {
      writer.write(encoder.encode('data: {"type":"ping"}\n\n'))
    } catch (error) {
      clearInterval(keepAlive)
    }
  }, 30000)

  // Handle connection close
  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive)
    writer.close()
  })

  // Return SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Function to broadcast cache invalidation to all connected clients
export function broadcastCacheInvalidation(data: { organizationId?: string, categories: string[], context?: string }) {
  const message = `data: ${JSON.stringify({
    type: 'cache-invalidation',
    ...data,
    timestamp: Date.now()
  })}\n\n`

  const encoder = new TextEncoder()
  const encoded = encoder.encode(message)

  // Broadcast to all connections
  connections.forEach((controller) => {
    try {
      controller.enqueue(encoded)
    } catch (error) {
      // Remove dead connections
      connections.delete(controller)
    }
  })
  
  console.log(`📡 Broadcasted cache invalidation to ${connections.size} clients:`, data)
} 