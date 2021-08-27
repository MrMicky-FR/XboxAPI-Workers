import { DateTime } from 'luxon'
import {
  ProfileResponse,
  UserCredentials,
  XboxProfile,
  XboxServiceCache,
  XboxToken,
} from './models'

declare const TOKEN_STORE: KVNamespace | undefined
declare const XBOX_ACCESS_TOKEN: string | undefined
declare const XBOX_REFRESH_TOKEN: string | undefined

export class XboxService {
  private readonly requests: string[] = []

  private refreshToken: XboxToken
  private accessToken: XboxToken
  private userToken?: XboxToken
  private xstsToken?: XboxToken
  private user?: UserCredentials

  constructor(cache: XboxServiceCache) {
    this.refreshToken = XboxToken.deserialize(cache.refreshToken)
    this.accessToken = XboxToken.deserialize(cache.accessToken)

    if (cache.xstsToken && cache.userToken && cache.user) {
      this.userToken = XboxToken.deserialize(cache.userToken)
      this.xstsToken = XboxToken.deserialize(cache.xstsToken)
      this.user = cache.user
    }
  }

  static async create(): Promise<XboxService> {
    if (typeof TOKEN_STORE !== 'undefined') {
      const cached = await TOKEN_STORE.get('cache')

      if (cached) {
        return new XboxService(JSON.parse(cached))
      }
    }

    const now = DateTime.now()

    if (
      typeof XBOX_ACCESS_TOKEN !== 'string' ||
      typeof XBOX_REFRESH_TOKEN !== 'string'
    ) {
      throw new Error('No access or refresh token available in environment.')
    }

    return new XboxService({
      accessToken: new XboxToken(XBOX_ACCESS_TOKEN, now, now.plus({ days: 1 })),
      refreshToken: new XboxToken(
        XBOX_REFRESH_TOKEN,
        now,
        now.plus({ months: 1 }),
      ),
    })
  }

  async getProfileByXuid(id: string): Promise<ProfileResponse> {
    return this.fetchProfileByRawId(`xuid(${id})`)
  }

  async getProfileByGamertag(name: string): Promise<ProfileResponse> {
    return this.fetchProfileByRawId(`gt(${name})`)
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

    const json = await response.json()
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
      info: `Response from Xbox API (${this.requests.join(',')})`,
    }
  }

  private async refreshAccessToken() {
    this.requests.push('refresh')

    const query =
      'grant_type=refresh_token&client_id=0000000048093EE3&scope=service::user.auth.xboxlive.com::MBI_SSL'

    const response = await fetch(
      `https://login.live.com/oauth20_token.srf?${query}&refresh_token=${this.refreshToken.token}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'XboxAPI-Workers',
        },
      },
    )

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
            RpsTicket: this.accessToken.token,
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

    const json = await response.json()
    const xui = json.DisplayClaims.xui[0]

    this.xstsToken = XboxToken.fromAuthResponse(json)
    this.user = {
      id: xui.xid,
      name: xui.gtg,
      hash: xui.uhs,
    }
  }

  async cacheService(): Promise<void> {
    if (typeof TOKEN_STORE === 'undefined') {
      return
    }

    return TOKEN_STORE.put(
      'cache',
      JSON.stringify({
        refreshToken: this.refreshToken,
        accessToken: this.accessToken,
        userToken: this.userToken,
        xstsToken: this.xstsToken,
        user: this.user,
      }),
    )
  }
}
