const fs = require('fs')
const { sleep, zip } = require('./utils')


const getVpcConfig = (vpcConfig) => {
  if (vpcConfig == 'undefined' || vpcConfig == null) {
    return {
      SecurityGroupIds: [],
      SubnetIds: []
    }
  }

  return {
    SecurityGroupIds: vpcConfig.securityGroupIds,
    SubnetIds: vpcConfig.subnetIds
  }
}

const updateOrCreateLambda = async (aws, params = {}) => {
  try {
    if (!params.lambdaName) {
      throw new Error(`Missing lambdaName param.`)
    }

    if (!params.roleArn) {
      // todo would it be valuable to create the role on behalf of the user?
      throw new Error(`Missing roleArn param.`)
    }

    // todo support src as string and create zip on the fly without access to fs
    if (!params.lambdaSrc) {
      throw new Error(`Missing lambdaSrc param.`)
    }

    // validate lambdaSrc is path to zip, path to dir, or buffer
    if (typeof params.lambdaSrc === 'string') {
      if (fs.lstatSync(params.lambdaSrc).isDirectory()) {
        // path to directory
        params.lambdaSrc = zip(params.lambdaSrc)
      } else {
        // path to zip file
        // todo validate it's a path to zip file
        params.lambdaSrc = await fs.promises.readFile(params.lambdaSrc)
      }
    }

    const lambda = new aws.Lambda()

    const vpcConfig = getVpcConfig(params.vpcConfig)

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
        },
        VpcConfig: vpcConfig
      }

      await lambda.updateFunctionConfiguration(updateFunctionConfigurationParams).promise()

      // Updates (like vpc changes) need to complete before calling updateFunctionCode
      await lambda.waitFor('functionUpdated', { FunctionName: params.lambdaName }).promise()

      const updateFunctionCodeParams = {
        FunctionName: params.lambdaName, // required
        ZipFile: params.lambdaSrc, // required
        Publish: params.publish === true ? true : false
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
        Publish: params.publish === true ? true : false,
        VpcConfig: vpcConfig
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
