const AWS = require('aws-sdk')
const utils = require('./utils')

const listAllCloudFormationStacksInARegion = async (
  config,
  {
    region = null,
    nextToken = null,
    stackStatusFilter = null,
    retry = 0
  },
  stacks = []) => {

  if (!region) {
    throw new Error(`Missing "region" param.`)
  }

  // If this is a retry attempt, and it's greater than 6, throw an error
  if (retry > 6) {
    throw new Error('AWS CloudFormation Rate Limit has been exceeded and retrying 6 times has failed.')
  }

  // If this is a retry attempt, add a sleep, and jitter it
  if (retry > 0) {
    let randomMs = Math.random() * (0.8 - 3.5) + 3.5
    randomMs = parseInt(randomMs * 1000)
    await utils.sleep(randomMs)
  }

  // Override region configuration
  config.region = region

  // Default to Stacks with an Active state, defined by these status values
  stackStatusFilter = stackStatusFilter || [
    'CREATE_COMPLETE',
    'UPDATE_COMPLETE',
    'ROLLBACK_COMPLETE',
    'IMPORT_COMPLETE',
    'IMPORT_ROLLBACK_COMPLETE',
  ]

  // Fetch stacks
  const cloudformation = new AWS.CloudFormation(config)

  const params = {
    NextToken: nextToken,
    StackStatusFilter: stackStatusFilter,
  }

  let res
  try {
    res = await cloudformation.listStacks(params).promise();
  } catch (error) {
    // Retry, if retryable
    if ((error.message && error.message.includes('Rate exceeded')) ||
      error.code === 'Throttling' ||
      error.retryable === true) {
      return await listAllCloudFormationStacksInARegion(
        config,
        {
          region,
          nextToken,
          stackStatusFilter,
          retry: retry + 1,
        },
        stacks
      );
    }
    throw error
  }

  // Concatenate stacks
  if (res.StackSummaries && res.StackSummaries.length) {

    // Add region to each
    res.StackSummaries.forEach((summary) => {
      summary.Region = region
    })

    stacks = stacks.concat(res.StackSummaries);
  }

  // If NextToken, call again...
  if (res.NextToken) {
    return await listAllCloudFormationStacksInARegion(
      config,
      {
        region,
        nextToken: res.NextToken,
        stackStatusFilter,
      },
      stacks
    );
  }

  return stacks
}

module.exports = listAllCloudFormationStacksInARegion
