import { XboxService } from './xbox/service'

declare const WEBHOOK_URL: string | undefined

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)

  if (url.pathname === '/') {
    return new Response('Welcome to XboxAPI Workers.')
  }

  // Compatibility for existing users
  if (url.pathname.startsWith('/profiles/search/')) {
    url.pathname = url.pathname.replace('/profiles/', '/')
  }

  const split = url.pathname.split('/').slice(1)

  if (split.length < 2) {
    return new Response(`Not found`, { status: 404 })
  }

  const [action, user] = split

  try {
    if (action === 'profiles') {
      return await handleProfileRequest(user)
    }

    if (action === 'search') {
      return await handleSearchRequest(user)
    }

    return new Response(`Unknown action: ${action}`, { status: 404 })
  } catch (e) {
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

    return new Response(`An error occurred: ${e}`, { status: 500 })
  }
}

async function handleProfileRequest(id: string): Promise<Response> {
  if (!/^\d+$/.test(id)) {
    return new Response('Invalid XUID format', { status: 400 })
  }

  const service = await XboxService.create()
  const response = await service.getProfileByXuid(id)

  if (response.profile === null) {
    return new Response(`User '${id}' not found (${response.info})`, {
      status: 404,
    })
  }

  return new Response(
    JSON.stringify({ ...response.profile, debug: response.info }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

async function handleSearchRequest(name: string): Promise<Response> {
  if (name.length === 0 || name.includes('(') || name.includes(')')) {
    return new Response('Invalid gamertag format', { status: 400 })
  }

  const service = await XboxService.create()
  const response = await service.getProfileByGamertag(name)

  if (response.profile === null) {
    return new Response(`User '${name}' not found (${response.info})`, {
      status: 404,
    })
  }

  return new Response(
    JSON.stringify({ ...response.profile, debug: response.info }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
}
