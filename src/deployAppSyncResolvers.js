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

const deployAppSyncResolver = async (aws, params) => {
  try {
    const updateResolverRes = await updateAppSyncResolver(aws, params)
    return updateResolverRes
  } catch (e) {
    if (e.code === 'NotFoundException' && e.message.includes(`No resolver found`)) {
      const createResolverRes = await createAppSyncResolver(aws, params)
      return createResolverRes
    }
    throw e
  }
}

module.exports = async (aws, params) => {
  // todo this logic does not update resolvers if it already exists
  // todo could there be other types that are not Query & Mutation?
  const { apiId, dataSourceName, resolvers } = params

  if (!apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  if (!dataSourceName) {
    throw new Error(`Missing "dataSourceName" param.`)
  }

  if (!resolvers) {
    throw new Error(`Missing "resolvers" param.`)
  }

  if (typeof resolvers !== 'object') {
    throw new Error(`"resolvers" param must be an object.`)
  }

  const { Query, Mutation } = resolvers

  if (Query && typeof Query !== 'object') {
    throw new Error(`"Query" must be an object of functions.`)
  }

  if (Mutation && typeof Mutation !== 'object') {
    throw new Error(`"Mutation" must be an object of functions.`)
  }

  const appSync = new aws.AppSync()

  const existingResolvers = await getExistingResolvers(aws, params)

  const resolverParams = {
    apiId,
    dataSourceName,
    kind: 'UNIT',
    requestMappingTemplate: `{ "version": "2017-02-28", "operation": "Invoke", "payload": $util.toJson($context)  }`,
    responseMappingTemplate: '$util.toJson($context.result)'
  }

  const promises = []

  // go through all user defined queries
  // and only deploy the new ones
  for (const definedQuery in Query) {
    if (typeof Query[definedQuery] !== 'function') {
      throw new Error(`"Query" must be an object of functions.`)
    }

    const queryResolverParams = {
      ...resolverParams,
      fieldName: definedQuery,
      typeName: 'Query'
    }

    // only deploy if defined query does not already exist in aws
    if (!existingResolvers.Query[definedQuery]) {
      promises.push(deployAppSyncResolver(aws, queryResolverParams))
    }
  }

  // go through all user defined mutations
  // and only deploy the new ones
  for (const definedMutation in Mutation) {
    if (typeof Mutation[definedMutation] !== 'function') {
      throw new Error(`"Mutation" must be an object of functions.`)
    }

    const mutationResolverParams = {
      ...resolverParams,
      fieldName: definedMutation,
      typeName: 'Mutation'
    }

    // only deploy if defined mutation does not already exist in aws
    if (!existingResolvers.Mutation[definedMutation]) {
      promises.push(deployAppSyncResolver(aws, mutationResolverParams))
    }
  }

  // go through all existing queries
  // and only remove the old ones
  for (const existingQuery in existingResolvers.Query) {
    // delete query resolver if no longer defined
    if (typeof Query !== 'object' || !Query[existingQuery]) {
      const deleteAppSyncResolverParams = {
        apiId,
        fieldName: existingQuery,
        typeName: 'Query'
      }
      promises.push(appSync.deleteResolver(deleteAppSyncResolverParams).promise())
    }
  }

  // go through all existing mutations
  // and only remove the old ones
  for (const existingMutation in existingResolvers.Mutation) {
    // delete mutation resolver if no longer defined
    if (typeof Mutation !== 'object' || !Mutation[existingMutation]) {
      const deleteAppSyncResolverParams = {
        apiId,
        fieldName: existingMutation,
        typeName: 'Mutation'
      }
      promises.push(appSync.deleteResolver(deleteAppSyncResolverParams).promise())
    }
  }

  // sync everything in parallel like a boss
  await Promise.all(promises)
}
