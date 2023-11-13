import type {SyncOperation} from '@usevenice/cdk-core'
import {z} from '@usevenice/util'

export type EntityPayload<TEntity = Record<string, unknown>> = Omit<
  z.infer<typeof zEntityPayload>,
  'entity'
> & {entity: TEntity}

export const zEntityPayload = z.object({
  /** TODO: Rename this to `stream` */
  entityName: z.string(),
  id: z.string(),
  entity: z.record(z.unknown()),
})

export type EntityPayloadWithRaw = z.infer<typeof zEntityPayloadWithRaw>
export const zEntityPayloadWithRaw = zEntityPayload.extend({
  raw: z.unknown(),
  providerName: z.string(),
  sourceId: z.string().optional(),
})

export type StdSyncOperation<
  TEntity extends Record<string, unknown> = Record<string, unknown>,
> = SyncOperation<EntityPayload<TEntity>>
