# Serverless AWS SDK
The aws sdk + powerful high-level serverless utilities.

```js
// 1. require the serverless aws sdk.
const aws = require(`@serverless/aws-sdk`)

// 2. set credentials globally for all services as usual.
aws.config.update({ credentials: { accessKeyId: '', secretAccessKey: '' }, region: 'us-east-1' })

// 3. use some powerful utilities. More info below.
const certificate = await aws.utils.deployCertificate({...})

// 4. this is the typical aws sdk. Do whatever else you want.
const s3 = new aws.S3()

```

# Reference

- [deployCertificate](#deployCertificate)
- [deployDistributionDns](#deployDistributionDns)

# deployCertificate
Deploys an ACM certificate for the given domain. It attempts to validate the domain via DNS if it is managed by AWS, otherwise, validation has to be done manually.

```js
const params = {
  domain: 'serverless.com'
}

const { arn, status, domainHostedZoneId } = await aws.utils.deployCertificate(params)
```

# deployDistributionDns
Deploys the domain DNS records for the provided distribution url. It also deploys DNS records for the `www` subdomain if the given domain is not a subdomain.

```js
const params = {
  domain: 'serverless.com',
  distributionUrl: 'https://xxx.cloudfront.net'
}

await aws.utils.deployDistributionDns(params)
```