import { DateTime } from 'luxon'

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
  created: DateTime
  expire: DateTime

  constructor(token: string, created: DateTime, expire: DateTime) {
    this.token = token
    this.created = created
    this.expire = expire
  }

  isExpired(): boolean {
    return this.expire < DateTime.now()
  }

  isValid(): boolean {
    return !this.isExpired()
  }

  static fromAuthResponse(response: ApiAuthResponse): XboxToken {
    const created = DateTime.fromISO(response.IssueInstant)
    const expire = DateTime.fromISO(response.NotAfter)

    return new XboxToken(response.Token, created, expire)
  }

  static fromRefreshResponse(
    response: ApiRefreshResponse,
  ): [XboxToken, XboxToken] {
    const now = DateTime.now()
    const accessExpire = now.plus({ seconds: response.expires_in })

    return [
      new XboxToken(response.access_token, now, accessExpire),
      new XboxToken(response.refresh_token, now, now.plus({ months: 1 })),
    ]
  }

  static deserialize(token: XboxToken | SerializedXboxToken): XboxToken {
    if (token instanceof XboxToken) {
      return token
    }

    const created = DateTime.fromISO(token.created)
    const expire = DateTime.fromISO(token.expire)

    return new XboxToken(token.token, created, expire)
  }
}
