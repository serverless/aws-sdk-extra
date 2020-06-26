const getAccountId = require('./getAccountId')

module.exports = async (aws, params) => {
  if (!params.region) {
    params.region = aws.config.region
  }

  if (!params.accountId) {
    params.accountId = await getAccountId(aws)
  }

  if (params.endpoint) {
    const result = /^https:\/\/([a-z0-9\-]+\.\w{2}\-[a-z]+\-\d\.es\.amazonaws\.com)$/.exec(
      params.endpoint
    )
    params.domain = result[1]
  }

  const arn = `arn:aws:es:${params.region}:${params.accountId}:domain/${params.domain}`

  return arn
}
