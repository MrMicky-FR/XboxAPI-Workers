# XboxAPI Workers

[![Node.js CI](https://github.com/MrMicky-FR/XboxAPI-Workers/actions/workflows/tests.yml/badge.svg)](https://github.com/MrMicky-FR/XboxAPI-Workers/actions/workflows/tests.yml)

A fast and simple Xbox Live API, built on [Cloudflare Workers](https://workers.cloudflare.com/).

This project uses two [Cloudflare Workers KV](https://www.cloudflare.com/developer-platform/workers-kv/) namespaces:
* _(Required)_ `TOKEN_STORE`: Used to store Xbox access tokens
* _(Optional)_ `PROFILES_CACHE`: Used to cache Xbox profiles to reduce responses time (profiles are cached for one hour)

## Features

* **Fast**: Running on more than 300 datacenters worldwide thanks to the power of [Cloudflare Workers](https://workers.cloudflare.com/)
* **Easy to use**: A profile can be fetched with a single GET request

## Installation

* Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
* Install dependencies with `npm install`
* Copy `wrangler.example.toml` to `wrangler.toml`
* Create a KV namespace named `TOKENS_STORE` and add its id in the `wrangler.toml`
* _(Optional)_ Create a KV namespace named `PROFILES_CACHE` and add its id in the `wrangler.toml`
* Configure the `XBOX_ACCESS_TOKEN` and `XBOX_REFRESH_TOKEN` variables in the `wrangler.toml` with your Xbox Live tokens (see below to obtain them)
* Publish to Workers with `workers publish`

### Get your Xbox Live tokens

* Go on [this link](https://login.live.com/oauth20_authorize.srf?display=touch&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&locale=en&response_type=token&client_id=0000000048093EE3) in your browser, authenticate and once you reach a blank page, copy the URL
* Extract the `access_token` and `refresh_token` parameters from the copied URL (you can also use [this tiny tool](https://jsfiddle.net/vc361wha/))

## Endpoints

### Fetch a profile by XUID

**GET** `/profile/{xuid}`

Example profile:
```json
{
  "xuid": "2533275056522057",
  "gamerscore": "28337",
  "gamertag": "Hello",
  "gamerpic": "https://images-eds-ssl.xboxlive.com/image?url=wHwbXKif8cus8csoZ03RW8ke8ralOdP9BGd4wzwl0MJ9z6QzuGwZjtvbE7sSsMVWdbcqfkxoWP60BSmwjdrqjdnbtjpTZg2sgv2Zu6A4iNhBj4V1ePvsMGSKEhUsgp5yZqOg.wtIFgQcnAf.8lY8BoeFGho.yDFWyybpENa_9L0-",
  "reputation": "GoodPlayer",
  "tier": "Gold",
  "bio": "",
  "location": "Hello from the otherside!"
}
```

### Fetch a profile by Gamertag

**GET** `/search/{gamertag}`

Example profile:
```json
{
  "xuid": "2533275056522057",
  "gamerscore": "28337",
  "gamertag": "Hello",
  "gamerpic": "https://images-eds-ssl.xboxlive.com/image?url=wHwbXKif8cus8csoZ03RW8ke8ralOdP9BGd4wzwl0MJ9z6QzuGwZjtvbE7sSsMVWdbcqfkxoWP60BSmwjdrqjdnbtjpTZg2sgv2Zu6A4iNhBj4V1ePvsMGSKEhUsgp5yZqOg.wtIFgQcnAf.8lY8BoeFGho.yDFWyybpENa_9L0-",
  "reputation": "GoodPlayer",
  "tier": "Gold",
  "bio": "",
  "location": "Hello from the otherside!"
}
```
