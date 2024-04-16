import type {ApolloSDK} from '@opensdks/sdk-apollo'
import {initApolloSDK} from '@opensdks/sdk-apollo'
import type {ConnectorServer} from '@openint/cdk'
import {Rx, rxjs} from '@openint/util'
import type {apolloSchemas} from './def'
import {APOLLO_ENTITY_NAME, apolloHelpers} from './def'

export const apolloServer = {
  newInstance: (opts) =>
    initApolloSDK({
      api_key: opts.settings.api_key,
      links: (defaultLinks) => [...opts.fetchLinks, ...defaultLinks],
    }),
  passthrough: (instance, input) =>
    instance.request(input.method, input.path, {
      headers: input.headers as Record<string, string>,
      params: {query: input.query},
      body: JSON.stringify(input.body),
    }),

  sourceSync: ({instance: apollo, streams}) => {
    console.log('[apollo] Will Sync apollo')
    async function* iterateEntities() {
      // const updatedSince = undefined
      console.log('[apollo] Starting sync', streams)
      for (const type of APOLLO_ENTITY_NAME) {
        if (!streams[type]) {
          continue
        }
        if (type === 'contact') {
          const res = await apollo.POST('/v1/contacts/search')
          yield res.data.contacts.map((c) =>
            apolloHelpers._opData(type, c.id, c),
          )
        }
      }
    }
    return rxjs
      .from(iterateEntities())
      .pipe(
        Rx.mergeMap((ops) => rxjs.from([...ops, apolloHelpers._op('commit')])),
      )
  },
} satisfies ConnectorServer<typeof apolloSchemas, ApolloSDK>

export default apolloServer
