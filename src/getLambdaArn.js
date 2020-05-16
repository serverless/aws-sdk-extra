const getAccountId = require('./getAccountId')

module.exports = async (aws, params) => {
  if (!params.region) {
    params.region = aws.config.region
  }

  if (!params.accountId) {
    params.accountId = await getAccountId(aws)
  }

  const arn = `arn:aws:lambda:${params.region}:${params.accountId}:function:${params.lambdaName}*`

  return arn
}
