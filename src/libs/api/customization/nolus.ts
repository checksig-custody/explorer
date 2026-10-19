import type { RequestRegistry } from '@/libs/api/registry';
import { CosmosRestClient } from '@/libs/client';
import { useBlockchain } from '@/stores';
import { adapter } from '@/libs/api/registry';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';

// Blockchain Name
export const name = 'nolus';

// nolus custom request
export const requests: Partial<RequestRegistry> = {
  mint_inflation: {
    url: '/nolus/mint/v1beta1/annual_inflation',
    adapter: async (data: unknown): Promise<{ inflation: string }> => {
      try {
        const client = CosmosRestClient.newDefault(useBlockchain().endpoint.address);
        const staking = await client.getStakingPool();
        const inflation = Number((data as { annual_inflation: string }).annual_inflation) / Number(staking.pool.bonded_tokens) || 0;
        return { inflation: inflation.toString() };
      } catch (error) {
        console.log('Error in adapter:', error);
        return { inflation: '0' };
      }
    },
  },
  gov_proposals: {
    url: '/cosmos/gov/v1/proposals',
    adapter: proposalsAdapter(),
  },
  gov_proposals_proposal_id: {
    url: '/cosmos/gov/v1/proposals/{proposal_id}',
    adapter: proposalByIdAdapter(),
  },
  gov_params_voting: { url: '/cosmos/gov/v1/params/voting', adapter },
  gov_params_tally: { url: '/cosmos/gov/v1/params/tallying', adapter },
  gov_params_deposit: { url: '/cosmos/gov/v1/params/deposit', adapter },
  gov_proposals_deposits: { url: '/cosmos/gov/v1/proposals/{proposal_id}/deposits', adapter },
  gov_proposals_tally: { url: '/cosmos/gov/v1/proposals/{proposal_id}/tally', adapter },
  gov_proposals_votes: { url: '/cosmos/gov/v1/proposals/{proposal_id}/votes', adapter },
  gov_proposals_votes_voter: { url: '/cosmos/gov/v1/proposals/{proposal_id}/votes/{voter}', adapter },
  bank_supply_by_denom: { url: '/cosmos/bank/v1beta1/supply/by_denom?denom={denom}', adapter },
};
