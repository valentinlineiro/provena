// Market Catalog Ports — contract tests against Memory implementations.
//
// These tests verify that MemoryMarket* satisfy the same behavioral contract
// that O2.4 PostgreSQL adapters must also satisfy. When O2.4 is implemented:
//
//   runMarketRepositoryContractTests(
//     () => new PostgresMarketOpportunityRepository(pool),
//     () => new PostgresMarketPostingRepository(pool),
//     () => new PostgresMarketModelStore(pool),
//   )
//
// ...should pass with zero test changes.

import {
  runMarketRepositoryContractTests,
  MemoryMarketOpportunityRepository,
  MemoryMarketPostingRepository,
  MemoryMarketModelStore,
} from './market-catalog-ports.js'

runMarketRepositoryContractTests(
  () => new MemoryMarketOpportunityRepository(),
  () => new MemoryMarketPostingRepository(),
  () => new MemoryMarketModelStore(),
)
