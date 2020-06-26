const { memoizeWith, identity } = require('ramda')

const getAccountId = async (aws) => {
  const sts = new aws.STS()

  const res = await sts.getCallerIdentity({}).promise()

  return res.Account
}

module.exports = memoizeWith(identity, getAccountId)
