# Serverless AWS SDK
The aws sdk + powerful high-level serverless utilities.

```js
// 1. require the serverless aws sdk.
const aws = require(`@serverless/aws-sdk`)

// 2. set credentials globally for all services as usual.
aws.config.update({ credentials: { accessKeyId: 'xxx', secretAccessKey: 'xxx' }, region: 'us-east-1' })

// 3. use some powerful utilities. More info below.
const certificate = await aws.utils.deployCertificate(params)

// 4. this is the typical aws sdk. Do whatever else you want.
const s3 = new aws.S3()

```

# Reference

- [deployDistributionDomain](#deployDistributionDomain)
- [deployCertificate](#deployCertificate)
- [deployDistributionDns](#deployDistributionDns)
- [addDomainToDistribution](#addDomainToDistribution)
- [getDomainHostedZoneId](#getDomainHostedZoneId)

# deployDistributionDomain

Deploys a CloudFront distribution domain by adding the domain to the distribution and deploying the certificate and DNS records.

```js
const params = {
  domain: 'serverless.com',
  distributionId: 'xxx'
}

const { certificateArn, certificateStatus, domainHostedZoneId } = await aws.utils.deployDistributionDomain(params)
```

# deployCertificate

Deploys a free ACM certificate for the given domain.

```js
const params = {
  domain: 'serverless.com',
}

const { certificateArn, certificateStatus, domainHostedZoneId } = await aws.utils.deployCertificate(params)
```

# deployDistributionDns

Deploys a DNS records for a distribution domain.

```js
const params = {
  domain: 'serverless.com',
  distributionUrl: 'xxx.cloudfront.net'
}

const { domainHostedZoneId } = await aws.utils.deployDistributionDns(params)
```

# addDomainToDistribution

Adds a domain or subdomain to a CloudFront Distribution.

```js
const params = {
  domain: 'serverless.com',
  certificateArn: 'xxx:xxx',
  certificateStatus: 'ISSUED',
}

const { domainHostedZoneId } = await aws.utils.addDomainToDistribution(params)
```

# getDomainHostedZoneId

Fetches the hosted zone id for the given domain.

```js
const params = {
  domain: 'serverless.com'
}

const { domainHostedZoneId } = await aws.utils.getDomainHostedZoneId(params)
```