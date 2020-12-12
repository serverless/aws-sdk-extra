const AWS = require('aws-sdk')

const listAllCloudFormationStackResources = async (
  config,
  {
    region = null,
    stackName = null,
    nextToken = null,
  },
  resources = []) => {

  if (!stackName) {
    throw new Error(`Missing "stackName" param.`)
  }
  if (!config.region && !region) {
    throw new Error(`Either config.region must be set or the 'region' parameter must be submitted`)
  }

  config.region = config.region || region

  // Fetch stacks
  const cloudformation = new AWS.CloudFormation(config)

  const params = {
    StackName: stackName,
    NextToken: nextToken,
  }

  const res = await cloudformation.listStackResources(params).promise();

  // Concatenate stacks
  if (res.StackResourceSummaries && res.StackResourceSummaries.length) {
    resources = resources.concat(resources, res.StackResourceSummaries);
  }

  // If NextToken, call again...
  if (res.NextToken) {
    return await listAllCloudFormationStackResources(
      config,
      {
        stackName,
        nextToken: res.NextToken,
      },
      resources
    );
  }

  return resources
}

module.exports = listAllCloudFormationStackResources
