const AWS = require('aws-sdk')
const { sleep } = require('./utils')

// todo checksum
const schemaCreation = async (config, params) => {
  const appSync = new AWS.AppSync(config)
  const { status, details } = await appSync
    .getSchemaCreationStatus({ apiId: params.apiId })
    .promise()

  if (status === 'PROCESSING') {
    // retry if still processing
    await sleep(1000)
    return schemaCreation(config, params)
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

module.exports = async (config, params = {}) => {
  if (!params.apiId) {
    throw new Error(`Missing "appId" param.`)
  }

  if (!params.schema) {
    throw new Error(`Missing "schema" param.`)
  }

  const appSync = new AWS.AppSync(config)

  await appSync
    .startSchemaCreation({
      apiId: params.apiId,
      definition: Buffer.from(params.schema)
    })
    .promise()

  const status = await schemaCreation(config, params)

  return { status }
}
