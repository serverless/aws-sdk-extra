const getAccountId = require('./getAccountId')

module.exports = async (config, params) => {
  if (!params.region) {
    params.region = config.region
  }

  if (!params.accountId) {
    params.accountId = await getAccountId(config)
  }

  if (params.lambdaName) {
    params.logGroupName = `/aws/lambda/${params.lambdaName}`
  }

  if (params.logGroupName) {
    throw new Error(`Missing "logGroupName" param.`)
  }

  const arn = `arn:aws:logs:${params.region}:${params.accountId}:log-group:${params.logGroupName}:*`

  return arn
}
