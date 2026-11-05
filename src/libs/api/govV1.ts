import type { GovProposal, PaginatedProposals } from '@/types';

type ProposalContent = GovProposal['content'];

// A gov v1 proposal as the node sends it. `proposalAdapter` reshapes it in
// place into the GovProposal the app reads.
interface ProposalWire {
  id?: string | undefined;
  messages?: (ProposalContent & { content?: ProposalContent })[];
  content?: ProposalContent;
  proposal_id?: string | undefined;
  final_tally_result?: {
    yes_count?: string;
    no_count?: string;
    no_with_veto_count?: string;
    abstain_count?: string;
    yes?: string | undefined;
    no?: string | undefined;
    no_with_veto?: string | undefined;
    abstain?: string | undefined;
  };
}

export function proposalAdapter(
  p: ProposalWire | undefined,
  setProposalId = true
): GovProposal {
  if (p) {
    const [first] = p.messages ?? [];
    if (first) {
      // `||`, not `??`: an empty content also falls back to the message.
      if (first.content) p.content = first.content;
      else p.content = first;
    }
    if (setProposalId) p.proposal_id = p.id;
    p.final_tally_result = {
      yes: p.final_tally_result?.yes_count,
      no: p.final_tally_result?.no_count,
      no_with_veto: p.final_tally_result?.no_with_veto_count,
      abstain: p.final_tally_result?.abstain_count,
    };
  }
  // The wire object now has the GovProposal fields the app uses.
  return p as unknown as GovProposal;
}

// The gov v1 list and single-proposal adapters, which every chain profile
// that serves gov v1 shares.
export function proposalsAdapter(setProposalId = true) {
  return (source: unknown): Promise<PaginatedProposals> => {
    const { proposals, pagination } = source as {
      proposals: ProposalWire[];
      pagination: PaginatedProposals['pagination'];
    };
    return Promise.resolve({
      proposals: proposals.map((p) => proposalAdapter(p, setProposalId)),
      pagination,
    });
  };
}

export function proposalByIdAdapter(setProposalId = true) {
  return (source: unknown): Promise<{ proposal: GovProposal }> => {
    const { proposal } = source as { proposal: ProposalWire | undefined };
    return Promise.resolve({
      proposal: proposalAdapter(proposal, setProposalId),
    });
  };
}
