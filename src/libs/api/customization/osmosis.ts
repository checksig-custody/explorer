import type { RequestRegistry } from '@/libs/api/registry';
// import dayjs from 'dayjs'
import { adapter } from '@/libs/api/registry';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';
import { orDefault } from '@/libs/utils';

// which registry is store
export const store = 'name'; // name or version
// Blockchain Name
export const name = 'osmosis';

// osmosis custom request
export const requests: Partial<RequestRegistry> = {
  mint_inflation: {
    url: `https://public-osmosis-api.numia.xyz/apr?start_date=${
      new Date(new Date().getTime() - 186400 * 1000)
        .toISOString()
        .split('T')[0] ?? ''
    }&end_date=${new Date().toISOString().split('T')[0] ?? ''}`,
    adapter: (data: unknown) => {
      const [first] = data as ({ apr?: string } | undefined)[];
      return Promise.resolve({
        inflation: String(Number(orDefault(first?.apr, '0')) / 100.0),
      });
    },
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
