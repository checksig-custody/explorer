import type { RequestRegistry } from '@/libs/api/registry';
// import dayjs from 'dayjs'
import { adapter } from '@/libs/api/registry';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';

// which registry is store
export const store = 'name'; // name or version
// Blockchain Name
export const name = 'atomone';

// osmosis custom request
export const requests: Partial<RequestRegistry> = {
  // mint_inflation: {
  //     url: `https://public-osmosis-api.numia.xyz/apr?start_date=${new Date(new Date().getTime() - 186400*1000).toISOString().split('T')[0]}&end_date=${new Date().toISOString().split('T')[0]}`,
  //     adapter: async (data: any) => {
  //         const [first] = data
  //         return {inflation: String(Number(first?.apr|| "0")/100.0)}
  //     }
  // },
  gov_params_voting: { url: '/atomone/gov/v1beta1/params/voting', adapter },
  gov_params_tally: { url: '/atomone/gov/v1beta1/params/tallying', adapter },
  gov_params_deposit: { url: '/atomone/gov/v1beta1/params/deposit', adapter },
  gov_proposals: {
    url: '/atomone/gov/v1beta1/proposals',
    adapter: proposalsAdapter(false),
  },
  gov_proposals_proposal_id: {
    url: '/atomone/gov/v1beta1/proposals/{proposal_id}',
    adapter: proposalByIdAdapter(false),
  },
  gov_proposals_deposits: {
    url: '/atomone/gov/v1beta1/proposals/{proposal_id}/deposits',
    adapter,
  },
  gov_proposals_tally: {
    url: '/atomone/gov/v1beta1/proposals/{proposal_id}/tally',
    adapter,
  },
  gov_proposals_votes: {
    url: '/atomone/gov/v1beta1/proposals/{proposal_id}/votes',
    adapter,
  },
  gov_proposals_votes_voter: {
    url: '/atomone/gov/v1beta1/proposals/{proposal_id}/votes/{voter}',
    adapter,
  },
};
