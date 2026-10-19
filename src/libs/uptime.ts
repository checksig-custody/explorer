export interface BlockColor {
  height: string;
  color: string;
}

// The parts of a block reply that the uptime grid reads. The reply is empty
// when the node did not answer.
export interface UptimeBlock {
  block?: {
    header: { height: string };
    last_commit?:
      | {
          signatures: {
            validator_address: string;
            block_id_flag: string;
          }[];
        }
      | undefined;
  };
}

// Adds one block to each validator's row of at most 50 colors: at the end for
// a new block, at the start for an older one.
export function fillBlock(
  colors: Record<string, BlockColor[]>,
  validators: { base64: string }[],
  b: UptimeBlock,
  direction = 'end'
) {
  const data = b.block;
  if (!data) return;
  validators.forEach((v) => {
    const sig = data.last_commit?.signatures.find(
      (s) => s.validator_address === v.base64
    );
    const block = colors[v.base64] ?? [];
    let color = {
      height: data.header.height,
      color: 'bg-red-500',
    };
    if (sig) {
      color = {
        height: data.header.height,
        color:
          sig.block_id_flag === 'BLOCK_ID_FLAG_COMMIT'
            ? 'bg-green-500'
            : 'bg-yellow-500',
      };
    }
    if (direction === 'end') {
      block.push(color);
    } else {
      block.unshift(color);
    }
    if (block.length > 50) block.shift();
    colors[v.base64] = block;
  });
}
