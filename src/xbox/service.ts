import { DateTime } from 'luxon'
import {
  ApiAuthResponse,
  ProfileResponse,
  UserCredentials,
  XboxProfile,
  XboxServiceCache,
  XboxToken,
} from './models'

interface Env {
  TOKEN_STORE?: KVNamespace
  PROFILES_CACHE?: KVNamespace
  XBOX_ACCESS_TOKEN?: string
  XBOX_REFRESH_TOKEN?: string
  MS_CLIENT_ID?: string
  MS_CLIENT_SECRET?: string
}

interface XboxUserResponse {
  profileUsers: Array<{
    id: string
    settings: Array<{ id: string; value: string }>
  }>
}

export class XboxService {
  private readonly requests: string[] = []

  private env: Env
  private refreshToken: XboxToken
  private accessToken: XboxToken
  private userToken?: XboxToken
  private xstsToken?: XboxToken
  private user?: UserCredentials

  constructor(env: Env, cache: XboxServiceCache) {
    this.refreshToken = XboxToken.deserialize(cache.refreshToken)
    this.accessToken = XboxToken.deserialize(cache.accessToken)
    this.env = env

    if (cache.xstsToken && cache.userToken && cache.user) {
      this.userToken = XboxToken.deserialize(cache.userToken)
      this.xstsToken = XboxToken.deserialize(cache.xstsToken)
      this.user = cache.user
    }
  }

  static async create(env: Env): Promise<XboxService> {
    if (env.TOKEN_STORE) {
      const cached = await env.TOKEN_STORE.get('cache')

      if (cached) {
        return new XboxService(env, JSON.parse(cached))
      }
    }

    const now = DateTime.now()

    if (!env.XBOX_ACCESS_TOKEN || !env.XBOX_REFRESH_TOKEN) {
      throw new Error('No access or refresh token available in environment.')
    }

    return new XboxService(env, {
      accessToken: new XboxToken(
        env.XBOX_ACCESS_TOKEN,
        now,
        now.plus({
          days: 1,
        }),
      ),
      refreshToken: new XboxToken(
        env.XBOX_REFRESH_TOKEN,
        now,
        now.plus({ months: 1 }),
      ),
    })
  }

  async getProfileByXuid(id: string): Promise<ProfileResponse> {
    return this.getProfileByRawId(`xuid(${id})`)
  }

  async getProfileByGamertag(name: string): Promise<ProfileResponse> {
    return this.getProfileByRawId(`gt(${name})`)
  }

  private async getProfileByRawId(profileId: string): Promise<ProfileResponse> {
    if (!this.env.PROFILES_CACHE) {
      return this.fetchProfileByRawId(profileId) // No cache is available
    }

    const cached = await this.env.PROFILES_CACHE.get(profileId)

    if (cached) {
      return {
        profile: cached === 'undefined' ? null : JSON.parse(cached),
        info: 'Cached profile',
      }
    }

    const res = await this.fetchProfileByRawId(profileId)

    await this.env.PROFILES_CACHE.put(profileId, JSON.stringify(res.profile), {
      expirationTtl: 3600, // 1 hour
    })

    return res
  }

  private async auth() {
    if (this.user && this.xstsToken && this.xstsToken.isValid()) {
      return
    }

    if (!this.userToken || this.userToken.isExpired()) {
      if (!this.accessToken || this.accessToken.isExpired()) {
        await this.refreshAccessToken()
      }

      await this.authenticate()
    }

    await this.authorize()

    await this.cacheService()
  }

  private async fetchProfileByRawId(profile: string): Promise<ProfileResponse> {
    await this.auth()

    if (!this.xstsToken || !this.user) {
      throw new Error('No user profile or XSTS token available')
    }

    this.requests.push('fetch')

    const settings =
      'Gamerscore,Gamertag,PublicGamerpic,XboxOneRep,AccountTier,Bio,Location'
    const response = await fetch(
      `https://profile.xboxlive.com/users/${profile}/profile/settings?settings=${settings}`,
      {
        headers: {
          Authorization: `XBL3.0 x=${this.user.hash};${this.xstsToken.token}`,
          'x-xbl-contract-version': '2',
          'Content-Type': 'application/json',
          'User-Agent': 'XboxAPI-Workers',
        },
      },
    )

    if (response.status === 404) {
      return { info: '404 response from Xbox API' }
    }

    if (!response.ok) {
      throw new Error(
        `Invalid status from Xbox profile: ${
          response.status
        } - ${await response.text()}`,
      )
    }

    const json = await response.json<XboxUserResponse>()
    const data = json.profileUsers[0]
    const xboxProfile: XboxProfile = { xuid: data.id }

    for (let i = 0; i < data.settings.length; i++) {
      const key = data.settings[i].id
      const value = data.settings[i].value

      switch (key) {
        case 'PublicGamerpic':
          xboxProfile.gamerpic = value
          break
        case 'AccountTier':
          xboxProfile.tier = value
          break
        case 'XboxOneRep':
          xboxProfile.reputation = value
          break
        default:
          xboxProfile[key.toLowerCase()] = value
          break
      }
    }

    return {
      profile: xboxProfile,
      info: `Response from Xbox API (${this.requests.join(', ')})`,
    }
  }

  private async refreshAccessToken() {
    this.requests.push('refresh')

    if (!this.env.MS_CLIENT_ID || !this.env.MS_CLIENT_SECRET) {
      throw new Error('Missing client ID/Secret')
    }

    const response = await fetch('https://login.live.com/oauth20_token.srf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'XboxAPI-Workers',
      },
      body: new URLSearchParams({
        client_id: this.env.MS_CLIENT_ID,
        client_secret: this.env.MS_CLIENT_SECRET,
        refresh_token: this.refreshToken.token,
        grant_type: 'refresh_token',
        scope: 'Xboxlive.signin Xboxlive.offline_access',
      }),
    })

    if (!response.ok) {
      throw new Error(`Invalid status from Xbox refresh: ${response.status}`)
    }

    const [accessToken, refreshToken] = XboxToken.fromRefreshResponse(
      await response.json(),
    )

    this.accessToken = accessToken
    this.refreshToken = refreshToken
  }

  private async authenticate() {
    if (!this.accessToken) {
      throw new Error('No access token available')
    }

    this.requests.push('authenticate')

    const response = await fetch(
      'https://user.auth.xboxlive.com/user/authenticate',
      {
        method: 'POST',
        headers: {
          'x-xbl-contract-version': '1',
          'Content-Type': 'application/json',
          'User-Agent': 'XboxAPI-Workers',
        },
        body: JSON.stringify({
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT',
          Properties: {
            AuthMethod: 'RPS',
            SiteName: 'user.auth.xboxlive.com',
            RpsTicket: `d=${this.accessToken.token}`,
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Invalid status from Xbox auth: ${response.status}`)
    }

    this.userToken = XboxToken.fromAuthResponse(await response.json())
  }

  private async authorize() {
    if (!this.userToken) {
      throw new Error('No user token available')
    }

    this.requests.push('authorize')

    const response = await fetch(
      'https://xsts.auth.xboxlive.com/xsts/authorize',
      {
        method: 'POST',
        headers: {
          'x-xbl-contract-version': '1',
          'Content-Type': 'application/json',
          'User-Agent': 'XboxAPI-Workers',
        },
        body: JSON.stringify({
          RelyingParty: 'http://xboxlive.com',
          TokenType: 'JWT',
          Properties: {
            SandboxId: 'RETAIL',
            UserTokens: [this.userToken.token],
          },
        }),
      },
    )

    if (!response.ok) {
      throw new Error(
        `Invalid status from Xbox authorization: ${
          response.status
        } - ${await response.text()}`,
      )
    }

    const json = await response.json<ApiAuthResponse>()
    const xui = json.DisplayClaims.xui[0]

    this.xstsToken = XboxToken.fromAuthResponse(json)
    this.user = { id: xui.xid, name: xui.gtg, hash: xui.uhs }
  }

  async cacheService(): Promise<void> {
    if (!this.env.TOKEN_STORE) {
      return
    }

    const tokens = {
      refreshToken: this.refreshToken,
      accessToken: this.accessToken,
      userToken: this.userToken,
      xstsToken: this.xstsToken,
      user: this.user,
    }

    return this.env.TOKEN_STORE.put('cache', JSON.stringify(tokens))
  }
}
