module.exports = async (aws, params) => {
  if (!params.apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  const appSync = new aws.AppSync()

  // set default expiration to be after 1 year minus 1 day
  // instead of the aws default of 7 days.
  // aws max is 1 year, so we gotta take a day out
  const nowInSeconds = Date.now() / 1000
  const oneYearInSeconds = 31556952
  const oneDayInSeconds = 86400
  const defaultExpiration = nowInSeconds + oneYearInSeconds - oneDayInSeconds

  var createApiKeyParams = {
    apiId: params.apiId,
    description: params.description || '',
    expires: params.expires || defaultExpiration
  }

  const {
    apiKey: { id }
  } = await appSync.createApiKey(createApiKeyParams).promise()

  return { apiKey: id }
}
