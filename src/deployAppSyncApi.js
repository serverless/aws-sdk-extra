const createAppSyncApi = async (aws, params) => {
  const appSync = new aws.AppSync()

  const createGraphqlApiParams = {
    name: params.apiName,
    authenticationType: params.authenticationType || 'API_KEY'
  }

  const { graphqlApi } = await appSync.createGraphqlApi(createGraphqlApiParams).promise()

  return graphqlApi
}

const updateAppSyncApi = async (aws, params) => {
  const appSync = new aws.AppSync()

  const updateGraphqlApiparams = {
    apiId: params.apiId,
    name: params.apiName,
    authenticationType: params.authenticationType || 'API_KEY'
  }

  const { graphqlApi } = await appSync.updateGraphqlApi(updateGraphqlApiparams).promise()

  return graphqlApi
}

module.exports = async (aws, params) => {
  if (!params.apiName) {
    throw new Error(`Missing "apiName" param.`)
  }

  try {
    const { apiId, arn, uris } = await updateAppSyncApi(aws, params)
    return { apiId, apiArn: arn, apiUrls: uris }
  } catch (e) {
    if (
      e.code === 'NotFoundException' ||
      e.message.includes(`Missing required key 'apiId' in params`)
    ) {
      const { apiId, arn, uris } = await createAppSyncApi(aws, params)
      return { apiId, apiArn: arn, apiUrls: uris }
    }
    throw e
  }
}
