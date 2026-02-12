#!/usr/bin/env bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building Lambda..."
pnpm --filter @ssv/lambdas build

echo "Building site..."
pnpm --filter @ssv/site build

echo "SAM build..."
sam build --template-file sam/template.yaml --base-dir .

echo "SAM deploy..."
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name ssv-validator \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  "${@}"

BUCKET=$(aws cloudformation describe-stacks --stack-name ssv-validator --query "Stacks[0].Outputs[?OutputKey=='SiteBucketName'].OutputValue" --output text)
echo "Syncing site to s3://${BUCKET}..."
aws s3 sync packages/site/out "s3://${BUCKET}" --delete

echo "Done. CloudFront URL:"
aws cloudformation describe-stacks --stack-name ssv-validator --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text
