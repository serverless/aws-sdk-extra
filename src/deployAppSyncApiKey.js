const AWS = require('aws-sdk')

const createAppSyncApiKey = require('./createAppSyncApiKey')

module.exports = async (config, params) => {
  if (!params.apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  const appSync = new AWS.AppSync(config)

  const createAppSyncApiKeyParams = {
    apiId: params.apiId,
    description: params.description,
    expires: params.expires
  }

  if (!params.apiKey) {
    return createAppSyncApiKey(config, createAppSyncApiKeyParams)
  }

  const listApiKeysParams = {
    apiId: params.apiId
  }

  const listApiKeysRes = await appSync.listApiKeys(listApiKeysParams).promise()

  const apiKeyExists = listApiKeysRes.apiKeys.find((apiKey) => apiKey.id === params.apiKey)

  if (apiKeyExists) {
    return { apiKey: apiKeyExists.id }
  }

  return createAppSyncApiKey(config, createAppSyncApiKeyParams)
}
