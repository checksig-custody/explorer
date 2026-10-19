import { defineStore } from 'pinia';
import { useBlockchain } from './useBlockchain';
import { maybe } from '@/libs/utils';
import type { PageRequest, PaginatedProposals } from '@/types';
import { LoadingStatus } from './useDashboard';
import { useWalletStore } from './useWalletStore';
import { reactive } from 'vue';

interface GovState {
  params: { deposit: object; voting: object; tally: object };
  // A proposals entry is undefined when no endpoint was set at the fetch.
  proposals: Record<string, PaginatedProposals | undefined>;
  loading: Record<string, LoadingStatus>;
}

export const useGovStore = defineStore('govStore', {
  state: (): GovState => {
    return {
      params: {
        deposit: {},
        voting: {},
        tally: {},
      },
      proposals: {},
      loading: {},
    };
  },
  getters: {
    blockchain() {
      return useBlockchain();
    },
    walletstore() {
      return useWalletStore();
    },
  },
  actions: {
    initial() {
      this.$reset();
      void this.fetchParams();
      void this.fetchProposals('2');
    },
    async fetchProposals(status: string, pagination?: PageRequest) {
      //if (!this.loading[status]) {
      this.loading[status] = LoadingStatus.Loading;
      const response = await this.blockchain
        .rpcIfSet()
        ?.getGovProposals(status, pagination);
      const proposals = response && reactive(response);

      //filter spam proposals
      // if (proposals?.proposals) {
      //   proposals.proposals = proposals.proposals.filter((item) => {
      //     const title = item.title || '';
      //     return title.toLowerCase().indexOf('airdrop') === -1;
      //   });
      // }

      if (status === '2') {
        maybe(proposals?.proposals)?.forEach((item) => {
          void this.fetchTally(item.proposal_id).then((res) => {
            item.final_tally_result = maybe(res)?.tally;
          });
          if (this.walletstore.currentAddress) {
            try {
              this.fetchProposalVotesVoter(
                item.proposal_id,
                this.walletstore.currentAddress
              )
                .then((res) => {
                  item.voterStatus =
                    res.vote.option || 'VOTE_OPTION_NO_WITH_VETO';
                  // 'No With Veto';
                })
                .catch(() => {
                  item.voterStatus = 'VOTE_OPTION_NO_WITH_VETO';
                });
            } catch {
              item.voterStatus = 'VOTE_OPTION_NO_WITH_VETO';
            }
          } else {
            item.voterStatus = 'VOTE_OPTION_NO_WITH_VETO';
          }
        });
      }

      this.loading[status] = LoadingStatus.Loaded;
      this.proposals[status] = proposals;
      //}
      return this.proposals[status];
    },
    fetchParams() {
      // this.blockchain.rpc.getGovParamsDeposit().then(x => {
      //     this.params.deposit = x.deposit
      // })
      return Promise.resolve();
    },
    async fetchTally(proposalId: string) {
      return await this.blockchain.rpc.getGovProposalTally(proposalId);
    },
    async fetchProposal(proposalId: string) {
      return this.blockchain.rpc.getGovProposal(proposalId);
    },
    async fetchProposalDeposits(proposalId: string) {
      return this.blockchain.rpc.getGovProposalDeposits(proposalId);
    },
    async fetchProposalVotes(proposalId: string, page?: PageRequest) {
      return this.blockchain.rpc.getGovProposalVotes(proposalId, page);
    },
    async fetchProposalVotesVoter(proposalId: string, voter: string) {
      return this.blockchain.rpc.getGovProposalVotesVoter(proposalId, voter);
    },
  },
});
