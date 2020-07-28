const AWS = require('aws-sdk')
const { head } = require('ramda')

const utils = require('./utils')

/**
 * Waits CloudFormation stack to reach certain event
 * @param {object} config
 * @param {object} params
 * @returns {object}
 */
module.exports = async (config, params) =>
  new Promise(async (resolve, reject) => {
    const cloudformation = new AWS.CloudFormation(config)
    const inProgress = true
    do {
      try {
        await utils.sleep(5000)
        const { Stacks } = await cloudformation
          .describeStacks({ StackName: params.stackName })
          .promise()
        const stackStatus = head(Stacks).StackStatus
        if (params.successEvent.test(stackStatus)) {
          return resolve(Stacks)
        } else if (params.failureEvent.test(stackStatus)) {
          return reject(new Error(`CloudFormation failed with status ${stackStatus}`))
        }
      } catch (error) {
        return reject(error)
      }
    } while (inProgress)
  })
