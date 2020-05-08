const fs = require('fs')
const { sleep, zip } = require('./utils')

const updateOrCreateLambda = async (aws, params = {}) => {
  try {
    if (!params.lambdaName) {
      throw new Error(`Missing lambdaName param.`)
    }

    if (!params.roleArn) {
      // todo would it be valuable to create the role on behalf of the user?
      throw new Error(`Missing roleArn param.`)
    }

    if (!params.lambdaSrc) {
      throw new Error(`Missing lambdaSrc param.`)
    }

    if (typeof params.lambdaSrc === 'string' && fs.lstatSync(params.lambdaSrc).isDirectory()) {
      params.lambdaSrc = zip(params.lambdaSrc)
    }

    const lambda = new aws.Lambda()

    try {
      const updateFunctionConfigurationParams = {
        FunctionName: params.lambdaName, // required
        Description: params.description || ``,
        Handler: params.handler || 'handler.handler',
        Role: params.roleArn, // required
        MemorySize: params.memory || 3008,
        Timeout: params.timeout || 300,
        Layers: params.layers || [],
        Runtime: params.runtime || 'nodejs12.x',
        Environment: {
          Variables: params.env || {}
        }
      }

      await lambda.updateFunctionConfiguration(updateFunctionConfigurationParams).promise()

      const updateFunctionCodeParams = {
        FunctionName: params.lambdaName, // required
        ZipFile: params.lambdaSrc, // required
        Publish: params.publish === false ? false : true
      }

      const lambdaRes = await lambda.updateFunctionCode(updateFunctionCodeParams).promise()

      return {
        lambdaArn: lambdaRes.FunctionArn,
        lambdaSize: lambdaRes.CodeSize,
        lambdaSha: lambdaRes.CodeSha256
      }
    } catch (e) {
      if (e.code !== 'ResourceNotFoundException') {
        throw e
      }
      const createFunctionParams = {
        FunctionName: params.lambdaName, // required
        Description: params.description || ``,
        Handler: params.handler || 'handler.handler',
        Code: {
          ZipFile: params.lambdaSrc // required
        },
        Environment: {
          Variables: params.env || {}
        },
        Role: params.roleArn, // required
        MemorySize: params.memory || 3008,
        Timeout: params.timeout || 300,
        Layers: params.layers || [],
        Runtime: params.runtime || 'nodejs12.x',
        Publish: params.publish === false ? false : true
      }

      const lambdaRes = await lambda.createFunction(createFunctionParams).promise()

      return {
        lambdaArn: lambdaRes.FunctionArn,
        lambdaSize: lambdaRes.CodeSize,
        lambdaSha: lambdaRes.CodeSha256
      }
    }
  } catch (e) {
    if (e.message.includes('The role defined for the function cannot be assumed by Lambda')) {
      await sleep(1000)
      return updateOrCreateLambda(aws, params)
    }
    throw e
  }
}

module.exports = updateOrCreateLambda
