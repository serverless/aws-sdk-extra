const AWS = require('aws-sdk')

const getAccountId = async (config) => {
  const sts = new AWS.STS(config)

  const res = await sts.getCallerIdentity({}).promise()

  return res.Account
}

module.exports = getAccountId
