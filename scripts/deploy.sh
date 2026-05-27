#!/usr/bin/env bash
set -euo pipefail

# Build the explorer and deploy it to the CheckSig testnet CloudFront site.
#
# The S3 bucket and CloudFront distribution are owned by the checksig-token repo
# CDK (stack ChecksigTestnetExplorer). This script resolves their identifiers
# from the stack's CloudFormation outputs at run time, so nothing is hardcoded
# and it survives a distribution replacement. AWS creds come from the ambient
# environment (AWS_PROFILE locally, OIDC role in CI), not a baked-in --profile.
#
#   AWS_PROFILE=token-testnet bash scripts/deploy.sh

export AWS_DEFAULT_REGION=eu-central-1
STACK=ChecksigTestnetExplorer

BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='ExplorerBucketName'].OutputValue" --output text)
DIST=$(aws cloudformation describe-stacks --stack-name "$STACK" --query "Stacks[0].Outputs[?OutputKey=='ExplorerDistributionId'].OutputValue" --output text)

yarn install --ignore-engines
yarn build

aws s3 sync dist/ "s3://$BUCKET/" --delete
aws cloudfront create-invalidation --distribution-id "$DIST" --paths '/*'
