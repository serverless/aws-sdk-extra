const createAppSyncApiKey = require('./createAppSyncApiKey')

module.exports = async (aws, params) => {
  if (!params.apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  const appSync = new aws.AppSync()

  const createAppSyncApiKeyParams = {
    apiId: params.apiId,
    description: params.description,
    expires: params.expires
  }

  if (!params.apiKey) {
    return createAppSyncApiKey(aws, createAppSyncApiKeyParams)
  }

  const listApiKeysParams = {
    apiId: params.apiId
  }

  const listApiKeysRes = await appSync.listApiKeys(listApiKeysParams).promise()

  const apiKeyExists = listApiKeysRes.apiKeys.find((apiKey) => apiKey.id === params.apiKey)

  if (apiKeyExists) {
    return { apiKey: apiKeyExists.id }
  }

  return createAppSyncApiKey(aws, createAppSyncApiKeyParams)
}
