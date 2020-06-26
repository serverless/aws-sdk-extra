const getAccountId = require('./getAccountId')

module.exports = async (aws, params) => {
  if (!params.accountId) {
    params.accountId = await getAccountId(aws)
  }

  const arn = `arn:aws:iam::${params.accountId}:role/${params.roleName}`

  return arn
}
