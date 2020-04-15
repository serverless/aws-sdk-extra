# Serverless AWS SDK
The aws sdk + powerful high-level serverless utilities.

```js
// 1. require the serverless aws sdk.
const aws = require(`@serverless/aws-sdk`)

// 2. set credentials globally for all services as usual.
aws.config.update({ credentials: { accessKeyId: '', secretAccessKey: '' }, region: 'us-east-1' })

// 3. use some powerful utilities. More info below.
const certificate = await aws.utils.ensureCertificate({...})

// 4. this is the typical aws sdk. Do whatever else you want.
const s3 = new aws.S3()

```

# Utils Reference

- [ensureCertificate](#ensurecertificate)

# ensureCertificate
Deploys an ACM certificate for the given domain. It attempts to validate the domain via DNS if it is managed by AWS, otherwise, validation has to be done manually.

```js
const params = {
  domain: 'serverless.com'
}

const { arn, status, domainHostedZoneId } = await aws.utils.ensureCertificate(params)
```