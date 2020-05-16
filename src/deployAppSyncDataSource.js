module.exports = async (aws, params) => {
  if (!params.apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  // note: data source name must not contain dashes. aws limitation.
  if (!params.dataSourceName) {
    throw new Error(`Missing "dataSourceName" param.`)
  }

  if (!params.lambdaArn) {
    throw new Error(`Missing "lambdaArn" param.`)
  }

  if (!params.roleArn) {
    throw new Error(`Missing "roleArn" param.`)
  }

  const appSync = new aws.AppSync()

  const dataSourceParams = {
    apiId: params.apiId,
    name: params.dataSourceName,
    description: params.dataSourceDescription || '',
    serviceRoleArn: params.roleArn,
    type: 'AWS_LAMBDA',
    lambdaConfig: {
      lambdaFunctionArn: params.lambdaArn
    }
  }

  try {
    const {
      dataSource: { dataSourceArn, name }
    } = await appSync.updateDataSource(dataSourceParams).promise()

    return { dataSourceArn, dataSourceName: name }
  } catch (e) {
    if (e.code === 'NotFoundException') {
      const {
        dataSource: { dataSourceArn, name }
      } = await appSync.createDataSource(dataSourceParams).promise()
      return { dataSourceArn, dataSourceName: name }
    }

    throw e
  }
}
