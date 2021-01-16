const AWS = require('aws-sdk')

module.exports = async (config, params) => {
  const sts = new AWS.STS(config)

  params.roleName = params.roleName || 'ServerlessInc'

  if (!params.accountId) {
    throw new Error(`Missing "accountId" param.`)
  }

  const assumeRoleParams = {
    RoleArn: `arn:aws:iam::${params.accountId}:role/${params.roleName}`,
    RoleSessionName: params.roleName
  }

  const { Credentials } = await sts.assumeRole(assumeRoleParams).promise()

  return {
    accessKeyId: Credentials.AccessKeyId,
    secretAccessKey: Credentials.SecretAccessKey,
    sessionToken: Credentials.SessionToken,
    expiration: Credentials.Expiration
  }
}
