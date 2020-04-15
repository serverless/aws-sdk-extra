# Serverless AWS SDK
The good old AWS SDK, plus powerful serverless utilities.

```js
// 1. require the serverless aws sdk.
const aws = require(`@serverless/aws-sdk`)

// 2. set credentials globally for all services as usual.
aws.config.update({ credentials: {}, region: 'us-east-1' })

// 3. use some powerful utilities. More info below.
const certificate = await aws.utils.ensureCertificate({...})

// 4. this is the typical aws sdk. Do whatever else you want.
const s3 = new aws.S3()

```

# Utils

- [ensureCertificate](#ensurecertificate)

# ensureCertificate