# Serverless AWS SDK
The aws sdk + powerful high-level serverless utilities.

```js
// require the serverless aws sdk.
const aws = require(`@serverless/aws-sdk`)

// set credentials, as usual.
aws.config.update({ credentials: { accessKeyId: 'xxx', secretAccessKey: 'xxx' }, region: 'us-east-1' })

// use any service, as usual.
const s3 = new aws.S3()

// use some powerful utilities. More info below.
const certificate = await aws.utils.deployCertificate(params)
```

# Reference

- [deployDistributionDomain](#deployDistributionDomain)
- [deployCertificate](#deployCertificate)
- [deployDistributionDns](#deployDistributionDns)
- [addDomainToDistribution](#addDomainToDistribution)
- [getDomainHostedZoneId](#getDomainHostedZoneId)
- [updateOrCreateRole](#updateOrCreateRole)
- [deleteRole](#deleteRole)
- [deleteRolePolicies](#deleteRolePolicies)

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

# updateOrCreateRole

Updates or creates the given role name with the given service & policy. You can specify an inline policy:

```js
const params = {
  name: 'my-role',
  service: 'lambda.amazonaws.com',
  policy: [
    {
      Effect: 'Allow',
      Action: ['sts:AssumeRole'],
      Resource: '*'
    },
    {
      Effect: 'Allow',
      Action: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
      Resource: '*'
    }
  ]
}
const { roleArn } = await aws.utils.updateOrCreateRole(params)
```

Or you can specify the policy as a maanged policy arn string:

```js
const params = {
  name: 'my-role',
  service: 'lambda.amazonaws.com',
  policy: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
}
const { roleArn } = await aws.utils.updateOrCreateRole(params)
```

If you don't specify a policy property, an admin policy will be created by default.

# deleteRole

Deletes the given role and all its attached managed and inline policies.

```js
const params = {
  name: 'my-role'
}

await aws.utils.deleteRole(params)
```

# deleteRolePolicies

Deletes all attached managed and inline policies for the given role.

```js
const params = {
  name: 'my-role'
}

await aws.utils.deleteRolePolicies(params)
```
