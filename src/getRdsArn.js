const getAccountId = require('./getAccountId')

module.exports = async (aws, params) => {
  if (!params.region) {
    params.region = aws.config.region
  }

  if (!params.accountId) {
    params.accountId = await getAccountId(aws)
  }

  const arn = `arn:aws:rds:${params.region}:${params.accountId}:cluster:${params.dbClusterIdentifier}`

  return arn
}
