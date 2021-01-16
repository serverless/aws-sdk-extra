const AWS = require('aws-sdk')
const { memoizeWith, identity } = require('ramda')

const getAccountId = async (config) => {
  const sts = new AWS.STS(config)

  const res = await sts.getCallerIdentity({}).promise()

  return res.Account
}

// memoize does not work nicely with lambda when it's hot
module.exports = memoizeWith(identity, getAccountId)
