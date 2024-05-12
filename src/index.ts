import type { IRequest } from 'itty-router'

import { Router, error, html, text } from 'itty-router'
import { XboxService } from './xbox/service'
import home from './home.html'

export interface Env {
  MS_CLIENT_ID?: string
  MS_CLIENT_SECRET?: string
  WEBHOOK_URL?: string
}

const router = Router()

router
  .get('/', handleHome)
  .get('/auth/redirect', handleAuthRedirect)
  .get('/auth/callback', handleAuthCallback)
  .get('/profiles/search/:name', handleSearchRequest)
  .get('/profiles/:id', handleProfileRequest)
  .get('/robots.txt', () => text('User-agent: *\nAllow: /$\nDisallow: /'))
  .all('*', () => error(404))

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return router.handle(request, env, ctx).catch(async (e: Error) => {
      console.error(e.toString())

      if (typeof env.WEBHOOK_URL === 'string') {
        await fetch(env.WEBHOOK_URL, {
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
  },
}

async function handleAuthRedirect(request: IRequest, env: Env) {
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    return error(503, 'Missing client ID/Secret')
  }

  if (!request.query || !request.query.redirect_uri) {
    return error(400, 'Missing query parameters')
  }

  const url = new URL(request.url)
  const uri = `${url.origin}/auth/callback?source=${request.query.redirect_uri}`

  const params = new URLSearchParams({
    client_id: env.MS_CLIENT_ID,
    redirect_uri: uri,
    scope: 'XboxLive.signin',
    response_type: 'code',
    prompt: 'select_account',
  })

  if (request.query.state) {
    params.set('state', request.query.state as string)
  }

  return Response.redirect(
    `https://login.live.com/oauth20_authorize.srf?${params}`,
  )
}

async function handleAuthCallback(request: IRequest, env: Env) {
  if (!env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) {
    return error(502, 'Missing client ID/Secret')
  }

  if (!request.query || !request.query.code || !request.query.source) {
    return error(400, 'Missing query parameters')
  }

  const url = new URL(request.url)
  const callback = `${url.origin}/auth/callback?source=${request.query.source}`

  const response = await fetch('https://login.live.com/oauth20_token.srf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: env.MS_CLIENT_ID,
      client_secret: env.MS_CLIENT_SECRET,
      code: request.query.code as string,
      redirect_uri: callback,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Invalid status from Xbox authorization: ${
        response.status
      } - ${await response.text()}`,
    )
  }

  const json = await response.json<{ access_token: string }>()

  const params = new URLSearchParams({
    code: `access_token:${json.access_token}`,
  })

  if (request.query.state) {
    params.set('state', request.query.state as string)
  }

  return Response.redirect(`${request.query.source}?${params}`)
}

async function handleProfileRequest(request: IRequest, env: Env) {
  const id = request.params?.id

  if (!id || !/^\d+$/.test(id)) {
    return error(400, 'Invalid XUID format')
  }

  const service = await XboxService.create(env)
  const response = await service.getProfileByXuid(id)

  if (!response.profile) {
    return error(404, `User '${id}' not found (${response.info})`)
  }

  return Response.json({ ...response.profile, debug: response.info })
}

async function handleSearchRequest(request: IRequest, env: Env) {
  const name = request.params?.name

  if (!name || name.length > 16 || name.includes('(') || name.includes(')')) {
    return error(400, 'Invalid gamertag format')
  }

  const service = await XboxService.create(env)
  const response = await service.getProfileByGamertag(name)

  if (!response.profile) {
    return error(404, `User '${name}' not found (${response.info})`)
  }

  return Response.json({ ...response.profile, debug: response.info })
}

async function handleHome() {
  return html(home.replace('{year}', new Date().getFullYear().toString()))
}
