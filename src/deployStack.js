const AWS = require('aws-sdk')
const {
  equals,
  mergeDeepRight,
  head,
  isEmpty,
  isNil,
  keys,
  map,
  merge,
  not,
  pick,
  reduce,
  toPairs
} = require('ramda')

const waitForStack = require('./waitForStack')

/**
 * Converts stack outputs to an object
 * @param {array} outputs
 * @returns {object} stack outputs
 */
const stackOutputsToObject = (outputs) =>
  reduce((acc, { OutputKey, OutputValue }) => merge(acc, { [OutputKey]: OutputValue }), {}, outputs)

/**
 * Fetches previously deployed stack
 * @param {object} cloudformation cloudformation client
 * @param {object} config config object
 * @returns {object} stack and info if stack needs to be updated
 */
const getPreviousStack = async (config, params) => {
  const cloudformation = new AWS.CloudFormation(config)

  let previousTemplate
  let stack

  try {
    previousTemplate = await cloudformation
      .getTemplate({ StackName: params.stackName, TemplateStage: 'Original' })
      .promise()
  } catch (error) {
    if (error.message !== `Stack with id ${params.stackName} does not exist`) {
      throw error
    }
  }

  if (isNil(previousTemplate)) {
    return {
      stack: {},
      needsUpdate: true
    }
  }

  try {
    const { Stacks } = await cloudformation
      .describeStacks({ StackName: params.stackName })
      .promise()
    stack = head(Stacks)
  } catch (error) {
    if (error.message !== `Stack with id ${params.stackName} does not exist`) {
      throw error
    }
  }

  const previousConfig = {
    parameters: reduce(
      (acc, { ParameterKey, ParameterValue }) => merge(acc, { [ParameterKey]: ParameterValue }),
      {},
      stack.Parameters
    ),
    role: stack.RoleARN,
    capabilities: stack.Capabilities,
    rollbackConfiguration: stack.RollbackConfiguration
  }

  if (
    equals(previousTemplate.TemplateBody, JSON.stringify(params.template)) &&
    equals(previousConfig, pick(keys(previousConfig), params))
  ) {
    return {
      stack,
      needsUpdate: false
    }
  }

  return {
    stack,
    exists: not(isEmpty(stack)),
    needsUpdate: true
  }
}

/**
 * Fetches stack outputs
 * @param {object} cloudformation
 * @param {object} config
 * @returns {array} stack outputs
 */
const fetchOutputs = async (config, params) => {
  const cloudformation = new AWS.CloudFormation(config)
  const { Stacks } = await cloudformation.describeStacks({ StackName: params.stackName }).promise()
  return stackOutputsToObject(head(Stacks).Outputs)
}

/**
 * Updates stack termination protection
 * @param {object} cloudformation
 * @param {object} config
 * @param {boolean} terminationProtectionEnabled
 */
const updateTerminationProtection = async (config, params, terminationProtectionEnabled) => {
  const cloudformation = new AWS.CloudFormation(config)
  if (not(equals(terminationProtectionEnabled, params.enableTerminationProtection))) {
    await cloudformation
      .updateTerminationProtection({
        EnableTerminationProtection: params.enableTerminationProtection,
        StackName: params.stackName
      })
      .promise()
  }
}

/**
 * Creates or updates the CloudFormation stack
 * @param {object} config aws sdk configuration object
 * @param {object} params method params
 * @returns {array} stack outputs
 */
const createOrUpdateStack = async (config, params) => {
  const cloudformation = new AWS.CloudFormation(config)

  const createorUpdateParams = {
    StackName: params.stackName,
    Capabilities: params.capabilities,
    RoleARN: params.role,
    RollbackConfiguration: params.rollbackConfiguration,
    Parameters: map(
      ([key, value]) => ({
        ParameterKey: key,
        ParameterValue: value
      }),
      toPairs(params.parameters)
    ),
    TemplateBody: JSON.stringify(params.template)
  }

  if (not(params.exists)) {
    await cloudformation
      .createStack(merge(createorUpdateParams, { DisableRollback: params.disableRollback }))
      .promise()
  } else {
    try {
      await cloudformation.updateStack(createorUpdateParams).promise()
    } catch (error) {
      if (error.message !== 'No updates are to be performed.') {
        throw error
      }
    }
  }

  const waitForStackParams = {
    stackName: params.stackName,
    successEvent: /^(CREATE|UPDATE)_COMPLETE$/,
    failureEvent: /^(.+_FAILED|.*ROLLBACK_COMPLETE)$/
  }

  const stacks = await waitForStack(config, waitForStackParams)

  return stackOutputsToObject(head(stacks).Outputs)
}

const defaults = {
  enableTerminationProtection: false,
  parameters: {},
  role: undefined,
  rollbackConfiguration: {},
  disableRollback: false,
  capabilities: [],
  timestamp: Date.now()
}

module.exports = async (config, params) => {
  params = mergeDeepRight(defaults, params)
  if (!params.template || !params.stackName) {
    throw new Error('"stackName" and "template" inputs are required.')
  }

  let stackOutputs = {}
  const previousStack = await getPreviousStack(config, params)

  if (previousStack.needsUpdate) {
    stackOutputs = await createOrUpdateStack(config, { ...params, exists: previousStack.exists })
  } else {
    stackOutputs = await fetchOutputs(config, params)
  }

  await updateTerminationProtection(
    config,
    params,
    !!previousStack.stack.EnableTerminationProtection
  )

  // todo changing stack name

  return stackOutputs
}
