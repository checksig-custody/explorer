import type { RequestRegistry } from '@/libs/api/registry';
import { adapter } from '@/libs/api/registry';
import { CosmosRestClient } from '@/libs/client';
import { useBlockchain } from '@/stores';
import { proposalsAdapter, proposalByIdAdapter } from '@/libs/api/govV1';

// which registry is store
export const store = 'name'; // name or version
// Blockchain Name
export const name = 'xion';

// xion custom request
export const requests: Partial<RequestRegistry> = {
  bank_supply_by_denom: {
    url: '/cosmos/bank/v1beta1/supply/by_denom?denom={denom}',
    adapter,
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
  mint_inflation: {
    url: '/cosmos/mint/v1beta1/inflation',
    adapter: async (data: unknown): Promise<{ inflation: string }> => {
      try {
        const client = CosmosRestClient.newDefault(useBlockchain().endpoint.address);

        // Get distribution params to fetch community tax
        const { params } = await client.getDistributionParams().catch((e: unknown) => {
          console.error('[Xion Adapter] Failed to fetch distribution params:', {
            error: e instanceof Error ? e.message : e,
            endpoint: '/distribution/params',
          });
          return { params: { community_tax: '0' } };
        });

        const communityTax = params.community_tax;

        // apr calcuation is inflation * (1 - communityTax)
        const adjustedInflation = parseFloat((data as { inflation: string }).inflation) * (1 - parseFloat(communityTax));

        return { inflation: adjustedInflation.toString() };
      } catch (e) {
        console.error('[Xion Adapter] Error calculating inflation:', {
          error: e instanceof Error ? e.message : e,
          timestamp: new Date().toISOString(),
          endpoint: useBlockchain().endpoint.address,
        });
        return { inflation: '0' };
      }
    },
  },
};
