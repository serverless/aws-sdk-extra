const AWS = require('aws-sdk')
const waitForStack = require('./waitForStack')

/**
 * Deletes the stack
 * @param {object} config
 * @param {object} params
 * @returns {object}
 */
module.exports = async (config, params) => {
  if (!params.stackName) {
    throw new Error(`"stackName" param is required.`)
  }
  const cloudformation = new AWS.CloudFormation(config)
  try {
    await cloudformation.deleteStack({ StackName: params.stackName }).promise()
    const waitForStackParams = {
      stackName: params.stackName,
      successEvent: /^DELETE_COMPLETE$/,
      failureEvent: /^DELETE_FAILED$/
    }
    return await waitForStack(config, waitForStackParams)
  } catch (error) {
    if (error.message !== `Stack with id ${params.stackName} does not exist`) {
      throw error
    }
  }
}
