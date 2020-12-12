const AWS = require('aws-sdk')

const listAllCloudFormationStacksInARegion = async (
  config,
  {
    region = null,
    nextToken = null,
    stackStatusFilter = null
  },
  stacks = []) => {

  if (!region) {
    throw new Error(`Missing "region" param.`)
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

  const res = await cloudformation.listStacks(params).promise();

  // Concatenate stacks
  if (res.StackSummaries && res.StackSummaries.length) {

    // Add region to each
    res.StackSummaries.forEach((summary) => {
      summary.Region = region
    })

    stacks = stacks.concat(stacks, res.StackSummaries);
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
