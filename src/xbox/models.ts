import { addMonths, addSeconds } from './date'

export interface XboxProfile {
  xuid: string
  [key: string]: string | number
}

export interface ProfileResponse {
  profile?: XboxProfile
  info: string
}

export interface UserCredentials {
  id: string
  name: string
  hash: string
}

export interface ApiRefreshResponse {
  access_token: string
  refresh_token: string
  expires_in: number
}

export interface ApiAuthResponse {
  IssueInstant: string
  NotAfter: string
  Token: string
  DisplayClaims: {
    xui: Array<{ xid: string; gtg: string; uhs: string }>
  }
}

export interface XboxServiceCache {
  refreshToken: XboxToken | SerializedXboxToken
  accessToken: XboxToken | SerializedXboxToken
  userToken?: XboxToken | SerializedXboxToken
  xstsToken?: XboxToken | SerializedXboxToken
  user?: UserCredentials
}

export interface SerializedXboxToken {
  token: string
  created: string
  expire: string
}

export class XboxToken {
  token: string
  created: Date
  expire: Date

  constructor(token: string, created: Date, expire: Date) {
    this.token = token
    this.created = created
    this.expire = expire
  }

  isExpired(): boolean {
    return this.expire.getTime() < Date.now()
  }

  isValid(): boolean {
    return !this.isExpired()
  }

  static fromAuthResponse(response: ApiAuthResponse): XboxToken {
    const created = new Date(response.IssueInstant)
    const expire = new Date(response.NotAfter)

    return new XboxToken(response.Token, created, expire)
  }

  static fromRefreshResponse(
    response: ApiRefreshResponse,
  ): [XboxToken, XboxToken] {
    const now = new Date()
    const accessExpire = addSeconds(now, response.expires_in)

    return [
      new XboxToken(response.access_token, now, accessExpire),
      new XboxToken(response.refresh_token, now, addMonths(now, 1)),
    ]
  }

  static deserialize(token: XboxToken | SerializedXboxToken): XboxToken {
    if (token instanceof XboxToken) {
      return token
    }

    const created = new Date(token.created)
    const expire = new Date(token.expire)

    return new XboxToken(token.token, created, expire)
  }
}
