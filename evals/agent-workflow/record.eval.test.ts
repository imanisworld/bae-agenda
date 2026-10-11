import { test } from 'vitest'
import { main } from './run-experiment'

test.skipIf(process.env.RECORD_AGENT_EVAL !== '1')('record agent-workflow results', async () => {
  await main()
}, 240_000)
