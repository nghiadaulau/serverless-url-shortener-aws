# serverless-url-shortener-aws

A production-grade **URL shortener with realtime click analytics**, built entirely
serverless on AWS. This is the hands-on code for the blog series *"Serverless Thực
Chiến Trên AWS"* — built step by step, one hard problem per article.

## Stack

- **IaC:** AWS SAM (`template.yaml`)
- **Runtime:** Node.js 22 + TypeScript, bundled with esbuild
- **Architecture:** arm64 (Graviton)
- **Region:** ap-southeast-1

## Services (added incrementally across the series)

API Gateway (HTTP API) · Lambda · DynamoDB (single-table) · Cognito ·
EventBridge · Step Functions · WebSocket API · CloudWatch / X-Ray.

## Layout

```
template.yaml          # SAM infrastructure
package.json           # build tooling (esbuild, typescript, types)
tsconfig.json
src/handlers/          # Lambda function handlers
```

## Common commands

```bash
sam build                                   # bundle TypeScript with esbuild
sam deploy --stack-name url-shortener \
  --resolve-s3 --capabilities CAPABILITY_IAM \
  --no-confirm-changeset --region ap-southeast-1
sam local invoke <Function> --event <file>  # run locally in Docker
sam delete --stack-name url-shortener --no-prompts --region ap-southeast-1
```

## Cost

Everything is pay-per-use; idle cost is effectively zero. Each part of the series
tears down its resources, and `sam delete` removes the whole stack.
