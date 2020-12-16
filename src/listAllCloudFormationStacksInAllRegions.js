/**
 * Sync - Syncs a CloudFormation Stack
 */

const getDefaults = require('./getDefaults');
const { getClients } = require('../utils')

const sync = async (credentials, {
  cloudFormationStackName = null,
  region = null
}) => {

  // Validate
  if (!cloudFormationStackName) {
    throw new Error(`Missing "cloudFormationStackName" input.`)
  }
  if (!region) {
    throw new Error(`Missing "region" input.`)
  }

  // Check credentials exist
  if (Object.keys(credentials).length === 0) {
    const msg =
      'AWS Credentials not found. Make sure you have a .env file in the current working directory. - Docs: https://git.io/JvArp';
    throw new Error(msg);
  }

  let outputs = getDefaults('outputs')

  await syncCloudFormation(outputs, credentials, cloudFormationStackName, region)

  await syncApiGateway(outputs, credentials, region)

  await syncAwsLambda(outputs, credentials, region)

  return outputs;
}

/**
 * Sync CloudFormation Stack
 */

const syncCloudFormation = async (outputs, credentials, cloudFormationStackName, region) => {

  const { cloudFormation, extras } = getClients(credentials, region)

  /**
   * Fetch CloudFormation Stack Summary & Resources
   */
  const stack = await Promise.all([
    cloudFormation.describeStacks({
      StackName: cloudFormationStackName
    }).promise(),
    extras.listAllCloudFormationStackResources({
      region,
      stackName: cloudFormationStackName
    }),
  ])
    .then((res) => {
      const summary = res[0].Stacks[0]

      return {
        summary,
        resources: res[1]
      }
    })

  stack.resources.forEach((r) => {

    // AWS::Lambda::Function
    if (r.ResourceType === 'AWS::Lambda::Function') {
      // Skip Serverless Framework Dashboard Lambda
      if (r.PhysicalResourceId.includes('custom-resource-apigw')) {
        return
      }
      outputs.functions = outputs.functions || {}
      outputs.functions[r.PhysicalResourceId] = getDefaults('fn')
      outputs.functions[r.PhysicalResourceId].name = r.PhysicalResourceId
    }

    // AWS::IAM::Role
    if (r.ResourceType === 'AWS::IAM::Role') {
      // Skip Serverless Framework Dashboard role
      if (r.PhysicalResourceId.includes('EnterpriseLog')) {
        return
      }
      outputs.defaultRole = outputs.defaultRole || getDefaults('defaultRole')
      outputs.defaultRole.name = r.PhysicalResourceId
    }

    // AWS::ApiGateway::RestApi
    if (r.ResourceType === 'AWS::ApiGateway::RestApi') {
      outputs.apiV1 = outputs.apiV1 || getDefaults('apiV1')
      outputs.apiV1.id = r.PhysicalResourceId
    }

    // AWS::ApiGateway::RestApi
    if (r.ResourceType === 'AWS::ApiGateway::Deployment') {
      outputs.apiV1 = outputs.apiV1 || getDefaults('apiV1')
      outputs.apiV1.deploymentId = r.PhysicalResourceId
    }
  })

  // Add service name
  let serviceName = cloudFormationStackName
  if (serviceName.includes('-')) {
    serviceName = serviceName.split('-')
    serviceName.pop()
    serviceName = serviceName.join('-')
  }
  outputs.service = serviceName

  return outputs
}

/**
 * Sync API Gateway
 */

const syncApiGateway = async (outputs, credentials, region) => {

  // If not API ID, skip...
  if (!outputs.apiV1) {
    return
  }

  const { apiV1 } = getClients(credentials, region)

  const paramsStages = {
    restApiId: outputs.apiV1.id,
    deploymentId: outputs.apiV1.deploymentId,
  };
  const resStages = await apiV1.getStages(paramsStages).promise()
  outputs.apiV1.stage = resStages.item[0].stageName

  const paramsExport = {
    exportType: 'oas30', /* required */
    restApiId: outputs.apiV1.id, /* required */
    stageName: outputs.apiV1.stage,
    accepts: 'application/json',
    parameters: {
      'extensions': 'apigateway',
    }
  }
  const resExport = await apiV1.getExport(paramsExport).promise()

  const openapi = JSON.parse(resExport.body.toString())

  // Remove components for now, they are not needed and take up space
  if (openapi.components) {
    delete openapi.components
  }

  // Remove unnecessary openapi data by traversing paths and methods
  for (const p in openapi.paths) {
    for (const m in openapi.paths[p]) {

      const method = openapi.paths[p][m]

      // Check the integration
      if (method['x-amazon-apigateway-integration']) {
        const integration = method['x-amazon-apigateway-integration']

        // Pull Lambda data
        if (integration.uri && integration.uri.includes(':lambda:')) {
          let functionName = integration.uri.split('function:')[1]
          functionName = functionName.replace('/invocations', '')

          // Add this to functions
          if (outputs.functions[functionName]) {
            outputs.functions[functionName].events.push({
              type: 'apiV1',
              path: p,
              method: m,
              // Add more data in the future
            })
          }
        }
      }
    }
  }

  outputs.apiV1.openApi = openapi

}

/**
 * Sync AWS Lambda
 */

const syncAwsLambda = async (outputs, credentials, region) => {

  // If no functions, skip...
  if (!outputs.functions) {
    return
  }

  const { lambda } = getClients(credentials, region)

  for (let fn in outputs.functions) {
    fn = outputs.functions[fn]

    const params = {
      FunctionName: fn.name,
      // Qualifier: "1"
    };
    const resFn = await lambda.getFunction(params).promise()

    // Copy data
    fn.arn = resFn.Configuration.FunctionArn
    fn.description = resFn.Configuration.Description
    fn.version = resFn.Configuration.Version
    if (resFn.Tags.Variables && Object.keys(resFn.Tags.Variables).length) { fn.tags = resFn.Tags.Variables }
    if (resFn.Configuration.Environment.Variables && Object.keys(resFn.Configuration.Environment.Variables).length) { fn.tags = resFn.Configuration.Environment.Variables }
    fn.src.handler = resFn.Configuration.Handler
    fn.image = resFn.Configuration.ImageConfigResponse
    fn.runtime = resFn.Configuration.Runtime
    fn.timeout = resFn.Configuration.Timeout
    fn.role = resFn.Configuration.Role
    fn.memory = resFn.Configuration.MemorySize
    fn.reservedConcurrency = resFn.Concurrency
    if (resFn.Configuration.Layers && Object.keys(resFn.Configuration.Layers).length) { fn.layers = resFn.Configuration.Layers }
    if (resFn.Configuration.FileSystemConfigs && Object.keys(resFn.Configuration.FileSystemConfigs).length) { fn.fileSystem = resFn.Configuration.FileSystemConfigs }
    fn.deadLetter = resFn.Configuration.DeadLetterConfig
    // VPC
    if (resFn.Configuration.VpcConfig && resFn.Configuration.VpcConfig.SubnetIds.length ||
      resFn.Configuration.VpcConfig && resFn.Configuration.VpcConfig.SecurityGroupIds.length) {
      fn.vpc = resFn.Configuration.VpcConfig
    }
  }
}

module.exports = sync;