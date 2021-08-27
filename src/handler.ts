import { Router, Request } from 'itty-router'
import { text, json, missing, error } from 'itty-router-extras'
import { XboxService } from './xbox/service'

declare const WEBHOOK_URL: string | undefined

const router = Router()

router
  .get('/', () => text('Welcome to XboxAPI Workers.'))
  .get('/profiles/search/:name', handleSearchRequest)
  .get('/profiles/:id', handleProfileRequest)
  .get('/search/:name', handleSearchRequest)
  .all('*', () => missing())

export function handleRequest(request: Request): Promise<Response> {
  return router.handle(request).catch(async (e: Error) => {
    console.error(e.toString())

    if (typeof WEBHOOK_URL === 'string') {
      fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          content: `**XboxAPI Workers** An error occurred on ${request.url}: \`${e}\``,
        }),
      })
    }

    return error(500, `Internal server error: ${e}`)
  })
}

async function handleProfileRequest(request: Request): Promise<Response> {
  const id = request.params?.id

  if (!id || !/^\d+$/.test(id)) {
    return error(400, 'Invalid XUID format')
  }

  const service = await XboxService.create()
  const response = await service.getProfileByXuid(id)

  if (response.profile === null) {
    return missing(`User '${name}' not found (${response.info})`)
  }

  return json({ ...response.profile, debug: response.info })
}

async function handleSearchRequest(request: Request): Promise<Response> {
  const name = request.params?.name

  if (!name || name.includes('(') || name.includes(')')) {
    return error(400, 'Invalid gamertag format')
  }

  const service = await XboxService.create()
  const response = await service.getProfileByGamertag(name)

  if (response.profile === null) {
    return missing(`User '${name}' not found (${response.info})`)
  }

  return json({ ...response.profile, debug: response.info })
}
