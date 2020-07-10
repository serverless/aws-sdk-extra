const getAccountId = require('./getAccountId')

module.exports = async (config, params) => {
  if (!params.region) {
    params.region = config.region
  }

  if (!params.accountId) {
    params.accountId = await getAccountId(config)
  }

  const arn = `arn:aws:rds:${params.region}:${params.accountId}:cluster:${params.dbClusterIdentifier}`

  return arn
}
