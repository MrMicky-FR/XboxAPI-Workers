# XboxAPI Workers

[![Node.js CI](https://github.com/MrMicky-FR/XboxAPI-Workers/actions/workflows/tests.yml/badge.svg)](https://github.com/MrMicky-FR/XboxAPI-Workers/actions/workflows/tests.yml)

A simple Xbox Live API, built on [Cloudflare Workers](https://workers.cloudflare.com/).

## Installation

* Install [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
* Install dependencies with `npm install`
* Copy `wrangler.example.toml` to `wrangler.toml`
* Create a KV namespace named `TOKENS_STORE` and add its id in the `wrangler.toml`
* Configure the `XBOX_ACCESS_TOKEN` and `XBOX_REFRESH_TOKEN` variables in the `wrangler.toml` with your Xbox Live tokens (see below to obtain them)
* Publish to Workers with `workers publish`

### Get your Xbox Live tokens
* Go on [this link](https://login.live.com/oauth20_authorize.srf?display=touch&scope=service%3A%3Auser.auth.xboxlive.com%3A%3AMBI_SSL&redirect_uri=https%3A%2F%2Flogin.live.com%2Foauth20_desktop.srf&locale=en&response_type=token&client_id=0000000048093EE3) in your browser, authenticate and once you reached a blank page, copy the url
* Extract the `access_token` and `refresh_token` parameters from the copied url (you can also use [this small tool](https://jsfiddle.net/vc361wha/))
