const getAccountId = require('./getAccountId')

module.exports = async (config, params) => {
  if (!params.accountId) {
    params.accountId = await getAccountId(config)
  }

  const arn = `arn:aws:iam::${params.accountId}:role/${params.roleName}`

  return arn
}
