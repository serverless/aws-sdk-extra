const AWS = require('aws-sdk')

const setAuthConfig = (config, params, createUpdateParams) => {
  if (!params.auth || params.auth === 'apiKey') {
    // api key auth
    createUpdateParams.authenticationType = 'API_KEY'
  } else if (params.auth === 'awsIam' || params.auth === 'iam') {
    // iam auth
    createUpdateParams.authenticationType = 'AWS_IAM'
  } else if (params.auth.userPoolId) {
    createUpdateParams.authenticationType = 'AMAZON_COGNITO_USER_POOLS'
    createUpdateParams.userPoolConfig = {
      // cognito auth config
      userPoolId: params.auth.userPoolId,
      defaultAction: params.auth.defaultAction || 'ALLOW',
      awsRegion: params.auth.region || config.region || 'us-east-1',
      appIdClientRegex: params.auth.appIdClientRegex
    }
  } else if (params.auth.issuer) {
    createUpdateParams.authenticationType = 'OPENID_CONNECT'
    // open id auth config
    createUpdateParams.openIDConnectConfig = {
      // cognito auth config
      issuer: params.auth.issuer,
      authTTL: params.auth.authTTL,
      clientId: params.auth.clientId,
      iatTTL: params.auth.iatTTL
    }
  } else {
    // set api key for any other case
    createUpdateParams.authenticationType = 'API_KEY'
  }

  return createUpdateParams
}

const createAppSyncApi = async (config, params) => {
  const appSync = new AWS.AppSync(config)

  let createGraphqlApiParams = {
    name: params.apiName
  }

  createGraphqlApiParams = setAuthConfig(config, params, createGraphqlApiParams)

  const { graphqlApi } = await appSync.createGraphqlApi(createGraphqlApiParams).promise()

  return graphqlApi
}

const updateAppSyncApi = async (config, params) => {
  const appSync = new AWS.AppSync(config)

  let updateGraphqlApiparams = {
    apiId: params.apiId,
    name: params.apiName
  }

  updateGraphqlApiparams = setAuthConfig(config, params, updateGraphqlApiparams)

  const { graphqlApi } = await appSync.updateGraphqlApi(updateGraphqlApiparams).promise()

  return graphqlApi
}

module.exports = async (config, params) => {
  if (!params.apiName) {
    throw new Error(`Missing "apiName" param.`)
  }

  try {
    const { apiId, arn, uris } = await updateAppSyncApi(config, params)
    return { apiId, apiArn: arn, apiUrls: uris }
  } catch (e) {
    if (
      e.code === 'NotFoundException' ||
      e.message.includes(`Missing required key 'apiId' in params`)
    ) {
      const { apiId, arn, uris } = await createAppSyncApi(config, params)
      return { apiId, apiArn: arn, apiUrls: uris }
    }
    throw e
  }
}
