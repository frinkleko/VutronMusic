import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { net } from 'electron'
import log from '../log'
import { pathCase } from 'change-case'
import * as qs from 'qs'

const API_BASE_URL = 'https://api-enhanced-theta.vercel.app/'

async function netease(fastify: FastifyInstance) {
  const handler = async (
    req: FastifyRequest<{
      Querystring: { [key: string]: string }
      Params: { [key:string]: string }
    }>,
    reply: FastifyReply
  ) => {
    const endpoint = req.url.split('/').pop().split('?')[0]
    const query = req.query
    const url = `${API_BASE_URL}${endpoint}?${qs.stringify(query)}`

    const cookie = (req as any).cookies
      ? Object.entries((req as any).cookies)
          .map(([key, value]) => `${key}=${value}`)
          .join('; ')
      : ''

    try {
      const response = await net.fetch(url.toString(), {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie
        },
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
      })

      const data = await response.json()
      reply.status(response.status).send(data)
    } catch (error: any) {
      log.error(`Netease API Error: ${endpoint}`, error)
      reply.status(500).send({ error: 'Internal Server Error' })
    }
  }

  // Dynamically create routes for all NeteaseCloudMusicApi functions
  const NeteaseCloudMusicApi = require('NeteaseCloudMusicApi')
  Object.keys(NeteaseCloudMusicApi).forEach((nameInSnakeCase) => {
    if (['serveNcmApi', 'getModulesDefinitions'].includes(nameInSnakeCase)) return
    const name = pathCase(nameInSnakeCase)
    fastify.get(`/netease/${name}`, handler)
    fastify.post(`/netease/${name}`, handler)
  })

  fastify.get('/netease', (_req, reply) => {
    reply.send('Netease API Proxy is active')
  })
}

export default netease
