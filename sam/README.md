# Deploy with SAM

Static site (S3 + CloudFront) and Validate API (Lambda + HTTP API). Single CloudFront URL: site at `/` and API at `/validate`.

## Prerequisites

- AWS CLI configured
- [SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html) installed
- Node 18+ and pnpm

## Deploy

From repo root:

```bash
chmod +x sam/deploy.sh   # once
pnpm run deploy
```

Or step by step:

```bash
pnpm --filter @ssv/lambdas build
pnpm --filter @ssv/site build
sam build --template-file sam/template.yaml --base-dir .
sam deploy --template-file .aws-sam/build/template.yaml --stack-name ssv-validator --capabilities CAPABILITY_IAM --resolve-s3
# Then sync site (use SiteBucketName from stack outputs):
aws s3 sync packages/site/out s3://<SiteBucketName> --delete
```

## After deploy

1. Set **NEXT_PUBLIC_VALIDATE_API_URL** to the **CloudFront URL** (e.g. `https://d123.cloudfront.net`) when building the site so the app calls `/validate` on the same origin. If you already built without it, rebuild with that env and re-sync S3.
2. Configure Lambda env vars (OpenAI, Gemini, Anthropic API keys) in the AWS Console → Lambda → Configuration → Environment variables, or add Parameters to the template and reference them.
3. Optional: custom domain (Route53 + ACM cert in us-east-1) and add to CloudFront; then set the env to your domain.

## Local Lambda dev

From repo root: `pnpm run dev:lambda` — runs a local server at http://localhost:3001 that invokes the handler. Reloads on file change. Set `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `ANTHROPIC_API_KEY` in `.env` or the environment.
