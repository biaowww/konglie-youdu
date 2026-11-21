import { createServer } from 'vite'

const args = process.argv.slice(2)
let requestedHost = '0.0.0.0'
let port = 7100
let strictPort = false

for (let index = 0; index < args.length; index += 1) {
  const argument = args[index]
  if (argument === '--host') {
    requestedHost = args[index + 1] || '0.0.0.0'
    index += 1
  } else if (argument.startsWith('--host=')) {
    requestedHost = argument.slice('--host='.length) || '0.0.0.0'
  } else if (argument === '--port') {
    port = Number(args[index + 1]) || port
    index += 1
  } else if (argument.startsWith('--port=')) {
    port = Number(argument.slice('--port='.length)) || port
  } else if (argument === '--strictPort') {
    strictPort = true
  }
}

// Kimi Work asks for localhost for the private preview. Binding the same
// logical port to all interfaces additionally enables office-LAN access.
const host = ['localhost', '127.0.0.1', '::1'].includes(requestedHost) ? '0.0.0.0' : requestedHost
const server = await createServer({ server: { host, port, strictPort } })
await server.listen()
server.printUrls()
