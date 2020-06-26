const { memoizeWith, omit } = require('ramda')
const { sleep } = require('./utils')

const listResolvers = async (aws, params) => {
  const appSync = new aws.AppSync()
  try {
    const res = await appSync.listResolvers(params).promise()

    // all we need is the field name
    return res.resolvers.reduce((resolvers, resolver) => {
      resolvers[resolver.fieldName] = resolver
      return resolvers
    }, {})
  } catch (e) {
    if (e.code === 'NotFoundException') {
      // if type (ie. Mutation) not found, just return an empty object
      return {}
    }
    throw e
  }
}

const getExistingResolvers = async (aws, { apiId }) => {
  const promises = [
    // todo any other types?
    listResolvers(aws, { apiId, typeName: 'Query' }),
    listResolvers(aws, { apiId, typeName: 'Mutation' })
  ]

  const res = await Promise.all(promises)

  return {
    Query: res[0],
    Mutation: res[1]
  }
}

const updateAppSyncResolver = async (aws, params) => {
  const appSync = new aws.AppSync()
  try {
    const updateResolverRes = await appSync.updateResolver(params).promise()
    return updateResolverRes
  } catch (e) {
    if (
      e.code === 'NotFoundException' &&
      e.message.includes('Type') &&
      e.message.includes('not found')
    ) {
      // let's not mask the error for now. Maybe it should be done at the component level
      // throw new Error(`Resolver type "${params.typeName}" was not found in your GraphQL schema.`)
      throw e
    } else {
      throw e
    }
  }
}

const createAppSyncResolver = async (aws, params) => {
  const appSync = new aws.AppSync()
  try {
    const createResolverRes = await appSync.createResolver(params).promise()
    return createResolverRes
  } catch (e) {
    if (
      e.code === 'NotFoundException' &&
      e.message.includes('Type') &&
      e.message.includes('not found')
    ) {
      // let's not mask the error for now. Maybe it should be done at the component level
      // throw new Error(`Resolver type "${params.typeName}" was not found in your GraphQL schema.`)
      throw e
    } else {
      throw e
    }
  }
}

const getDataSourceName = (name) => {
  // todo this won't scale. usersposts & users-posts would end up being the same
  return name.replace(/[^a-z0-9]/gi, '') // data source name must be alphanumeric
}

const deployAppSyncDataSource = async (aws, params) => {
  const appSync = new aws.AppSync()

  const dataSourceParams = {
    apiId: params.apiId,
    serviceRoleArn: await aws.utils.getRoleArn({ roleName: params.roleName })
  }

  if (params.lambda) {
    // lambda config
    dataSourceParams.name = getDataSourceName(params.lambda)
    dataSourceParams.type = 'AWS_LAMBDA'
    dataSourceParams.lambdaConfig = {
      lambdaFunctionArn: await aws.utils.getLambdaArn({ lambdaName: params.lambda })
    }
  } else if (params.table) {
    // dynamodb config
    dataSourceParams.name = getDataSourceName(params.table)
    dataSourceParams.type = 'AMAZON_DYNAMODB'
    dataSourceParams.dynamodbConfig = {
      awsRegion: params.tableRegion || aws.config.region,
      tableName: params.table
    }

    if (params.ttl) {
      dataSourceParams.dynamodbConfig.deltaSyncConfig =
        dataSourceParams.dynamodbConfig.deltaSyncConfig || {}
      dataSourceParams.dynamodbConfig.deltaSyncConfig.baseTableTTL = params.ttl
    }

    if (params.syncTable) {
      dataSourceParams.dynamodbConfig.deltaSyncConfig =
        dataSourceParams.dynamodbConfig.deltaSyncConfig || {}
      dataSourceParams.dynamodbConfig.deltaSyncConfig.deltaSyncTableName = params.syncTable
    }

    if (params.syncTableTtl) {
      dataSourceParams.dynamodbConfig.deltaSyncConfig =
        dataSourceParams.dynamodbConfig.deltaSyncConfig || {}
      dataSourceParams.dynamodbConfig.deltaSyncConfig.deltaSyncTableTTL = params.syncTableTtl
    }
  } else if (params.authorizationConfig) {
    dataSourceParams.name = params.name // required. todo how to auto generate endpoint?!
    dataSourceParams.type = 'HTTP'
    dataSourceParams.httpConfig = {
      endpoint: params.endpoint, // required
      authorizationConfig: {
        authorizationType: params.authorization, // required.
        awsIamConfig: {
          signingRegion: params.signingRegion,
          signingServiceName: params.signingServiceName
        }
      }
    }
  } else if (params.endpoint) {
    // elasticsearch config
    dataSourceParams.name = params.name // required. todo how to auto generate endpoint?!
    dataSourceParams.type = 'AMAZON_ELASTICSEARCH'
    dataSourceParams.elasticsearchConfig = {
      awsRegion: params.endpointRegion || aws.config.region,
      endpoint: params.endpoint
    }
  } else if (params.relationalDatabaseSourceType) {
    // relational data base config
    dataSourceParams.name = params.name || getDataSourceName(params.database)
    dataSourceParams.type = 'RELATIONAL_DATABASE'
    dataSourceParams.relationalDatabaseConfig = {
      relationalDatabaseSourceType: params.relationalDatabaseSourceType,
      rdsHttpEndpointConfig: {
        awsRegion: params.endpointRegion || aws.config.region,
        awsSecretStoreArn: params.awsSecretStoreArn,
        databaseName: params.database,
        dbClusterIdentifier: params.dbClusterIdentifier,
        schema: params.schema
      }
    }
  } else {
    throw new Error(`Please specify a data source for resolver "${params.type}.${params.field}"`)
  }

  try {
    const {
      dataSource: { dataSourceArn, name }
    } = await appSync.updateDataSource(dataSourceParams).promise()

    return { dataSourceArn, dataSourceName: name }
  } catch (e) {
    if (e.code === 'NotFoundException') {
      try {
        const {
          dataSource: { dataSourceArn, name }
        } = await appSync.createDataSource(dataSourceParams).promise()
        return { dataSourceArn, dataSourceName: name }
      } catch (createError) {
        if (
          createError.code === 'BadRequestException' &&
          createError.message.includes('Data source with name')
        ) {
          const {
            dataSource: { dataSourceArn, name }
          } = await appSync.updateDataSource(dataSourceParams).promise()

          return { dataSourceArn, dataSourceName: name }
        }
        throw createError
      }
    }

    throw e
  }
}
const crypto = require('crypto')

const deployAppSyncDataSourceCached = memoizeWith((aws, params) => {
  // for multiple resolvers using the same data source, we just need
  // to deploy the data source once. This function uses a memoized/cached
  // version of the function if called twice
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify(omit(['type', 'field', 'request', 'response'], params)))
    .digest('hex')
  return hash
}, deployAppSyncDataSource)

const deployAppSyncResolver = async (aws, params) => {
  const { dataSourceName } = await deployAppSyncDataSource(aws, params)
  const resolverParams = {
    apiId: params.apiId,
    kind: 'UNIT',
    typeName: params.type,
    fieldName: params.field,
    dataSourceName: dataSourceName,
    requestMappingTemplate:
      params.request ||
      `{ "version": "2017-02-28", "operation": "Invoke", "payload": $util.toJson($context)  }`,
    responseMappingTemplate: params.response || '$util.toJson($context.result)'
  }
  try {
    const updateResolverRes = await updateAppSyncResolver(aws, resolverParams)
    return updateResolverRes
  } catch (e) {
    if (e.code === 'NotFoundException' && e.message.includes(`No resolver found`)) {
      const createResolverRes = await createAppSyncResolver(aws, resolverParams)
      return createResolverRes
    }
    throw e
  }
}

const getExistingDataSourcesNames = async (aws, { apiId }) => {
  const appSync = new aws.AppSync()

  const listDataSourcesRes = await appSync.listDataSources({ apiId }).promise()

  return listDataSourcesRes.dataSources.map((dataSource) => dataSource.name)
}

const getDataSourcesNames = (resolvers) => {
  const dataSourcesNames = []

  for (const type in resolvers) {
    for (const field in resolvers[type]) {
      const { lambda, table } = resolvers[type][field]
      const dataSourceName = getDataSourceName(lambda || table)
      dataSourcesNames.push(dataSourceName)
    }
  }

  return dataSourcesNames
}

const deployAppSyncResolvers = async (aws, params) => {
  try {
    const { apiId, roleName, resolvers } = params

    if (!apiId) {
      throw new Error(`Missing "apiId" param.`)
    }

    if (!roleName) {
      throw new Error(`Missing "roleName" param.`)
    }

    if (typeof resolvers !== 'object') {
      throw new Error(`"resolvers" param is missing or is not an object.`)
    }

    const existingResources = await Promise.all([
      getExistingResolvers(aws, params),
      getExistingDataSourcesNames(aws, params)
    ])
    const existingResolvers = existingResources[0]
    const existingDataSourcesNames = existingResources[1]

    const promises = []

    for (const type in resolvers) {
      if (typeof resolvers[type] !== 'object') {
        throw new Error(`"resolvers.${type}" must be an object.`)
      }

      for (const field in resolvers[type]) {
        if (typeof resolvers[type][field] !== 'object') {
          throw new Error(`"resolvers.${type}.${field}" must be an object.`)
        }

        const resolverParams = {
          ...resolvers[type][field],
          apiId,
          roleName,
          type: type,
          field: field
        }
        promises.push(deployAppSyncResolver(aws, resolverParams))
      }
    }

    for (const type in existingResolvers) {
      for (const field in existingResolvers[type]) {
        if (!resolvers[type] || !resolvers[type][field]) {
          const appSync = new aws.AppSync()
          const deleteAppSyncResolverParams = {
            apiId,
            fieldName: field,
            typeName: type
          }
          promises.push(appSync.deleteResolver(deleteAppSyncResolverParams).promise())
        }
      }
    }

    await Promise.all(promises)

    const dataSourcesNames = getDataSourcesNames(resolvers)

    const removeOutdatedDataSources = []
    for (const existingDataSourceName of existingDataSourcesNames) {
      if (!dataSourcesNames.includes(existingDataSourceName)) {
        const appSync = new aws.AppSync()
        const deleteDataSourceParams = {
          apiId,
          name: existingDataSourceName
        }
        removeOutdatedDataSources.push(appSync.deleteDataSource(deleteDataSourceParams).promise())
      }
    }

    await Promise.all(removeOutdatedDataSources)
  } catch (e) {
    if (
      e.code === 'ConcurrentModificationException' &&
      e.message.includes('Schema is currently being altered')
    ) {
      await sleep(1000)
      const deployAppSyncResolversRes = await deployAppSyncResolvers(aws, params)
      return deployAppSyncResolversRes
    }
    throw e
  }
}

module.exports = deployAppSyncResolvers
