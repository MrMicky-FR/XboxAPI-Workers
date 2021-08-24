import { handleRequest } from './handler'
import { Settings } from 'luxon'

Settings.throwOnInvalid = true

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})
