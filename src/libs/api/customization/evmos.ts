import type { RequestRegistry } from '../registry';
import { adapter } from '../registry';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';
// which registry is store
export const store = 'name'; // name or version
// Blockchain Name
export const name = 'evmos';

export const requests: Partial<RequestRegistry> = {
  mint_inflation: {
    url: '/evmos/inflation/v1/inflation_rate',
    adapter: (data: unknown) =>
      Promise.resolve({
        inflation: (
          Number((data as { inflation_rate?: string }).inflation_rate || 0) /
          100
        ).toFixed(2),
      }),
  },
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
