import type { RequestRegistry } from '@/libs/api/registry';
import { adapter } from '@/libs/api/registry';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';

// which registry is store
export const store = 'version'; // name or version
// Cosmos SDK version
export const name = 'v0.50.0';

export const requests: Partial<RequestRegistry> = {
  bank_supply_by_denom: { url: '/cosmos/bank/v1beta1/supply/by_denom?denom={denom}', adapter },
  gov_params_voting: { url: '/cosmos/gov/v1/params/voting', adapter },
  gov_params_tally: { url: '/cosmos/gov/v1/params/tallying', adapter },
  gov_params_deposit: { url: '/cosmos/gov/v1/params/deposit', adapter },
  gov_proposals: {
    url: '/cosmos/gov/v1/proposals',
    adapter: proposalsAdapter(),
  },
  gov_proposals_proposal_id: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}',
    adapter: proposalByIdAdapter(),
  },
  gov_proposals_deposits: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}/deposits',
    adapter,
  },
  gov_proposals_tally: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}/tally',
    adapter,
  },
  gov_proposals_votes: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}/votes',
    adapter,
  },
  gov_proposals_votes_voter: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}/votes/{voter}',
    adapter,
  },
};
