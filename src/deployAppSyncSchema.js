const { sleep } = require('./utils')
// todo checksum
const schemaCreation = async (aws, params) => {
  const appSync = new aws.AppSync()
  const { status, details } = await appSync
    .getSchemaCreationStatus({ apiId: params.apiId })
    .promise()

  if (status === 'PROCESSING') {
    // retry if still processing
    await sleep(1000)
    return schemaCreation(aws, params)
  } else if (status === 'SUCCESS') {
    // return if success
    return status
  } else if (status === 'FAILED' && details.includes('Internal Failure while saving the schema')) {
    // this error usually happens when the schema is in valid
    throw new Error(`Failed to save the schema. Please make sure it is a valid GraphQL schema.`)
  }

  // throw error for any other unsupported status
  throw new Error(`AppSync schema status: ${status} - ${details}`)
}

module.exports = async (aws, params = {}) => {
  if (!params.apiId) {
    throw new Error(`Missing "appId" param.`)
  }

  if (!params.schema) {
    throw new Error(`Missing "schema" param.`)
  }

  const appSync = new aws.AppSync()

  await appSync
    .startSchemaCreation({
      apiId: params.apiId,
      definition: Buffer.from(params.schema)
    })
    .promise()

  const status = await schemaCreation(aws, params)

  return { status }
}
