const AWS = require('aws-sdk')
const getAccoutId = require('./getAccountId')
const deployCertificate = require('./deployCertificate')
const { sleep } = require('./utils')

const addPermission = async (config, params = {}) => {
  const lambda = new AWS.Lambda(config)

  const accountId = await getAccoutId(config)
  const apigArn = `arn:aws:execute-api:${config.region}:${accountId}:${params.apiId}/*/*`

  const paramsPermission = {
    Action: 'lambda:InvokeFunction',
    FunctionName: params.lambdaArn,
    Principal: 'apigateway.amazonaws.com',
    SourceArn: apigArn,
    StatementId: `API-${params.apiId}`
  }
  try {
    await lambda.addPermission(paramsPermission).promise()
  } catch (e) {
    if (!e.message.includes('already exists')) {
      throw e
    }
  }
}

const updateApi = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  const updateApiParams = {
    ApiId: params.apiId,
    Description: params.description || '',
    Target: `arn:aws:apigateway:${config.region}:lambda:path/2015-03-31/functions/${params.lambdaArn}/invocations`
  }

  await apig.updateApi(updateApiParams).promise()

  await addPermission(config, params)

  return {
    apiId: params.apiId,
    url: `https://${params.apiId}.execute-api.${config.region}.amazonaws.com`
  }
}

const createApi = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  const createApiParams = {
    Name: params.apiName || 'serverless-api',
    ProtocolType: 'HTTP',
    Description: params.description,
    Target: `arn:aws:apigateway:${config.region}:lambda:path/2015-03-31/functions/${params.lambdaArn}/invocations`
  }

  const res = await apig.createApi(createApiParams).promise()

  params.apiId = res.ApiId

  await addPermission(config, params)

  return {
    apiId: params.apiId,
    url: `https://${params.apiId}.execute-api.${config.region}.amazonaws.com`
  }
}

const deployApiMapping = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  let apiMapping
  const paramsGet = {
    DomainName: params.domain
  }
  const apiMappings = await apig.getApiMappings(paramsGet).promise()
  apiMappings.Items.forEach((am) => {
    if (am.ApiId === params.apiId) {
      apiMapping = am
    }
  })

  if (apiMapping) {
    return apiMapping.ApiMappingId
  }

  try {
    const createApiMappingParams = {
      DomainName: params.domain,
      ApiId: params.apiId,
      Stage: '$default'
    }

    const resMapping = await apig.createApiMapping(createApiMappingParams).promise()
    return resMapping.ApiMappingId
  } catch (e) {
    if (e.code === 'TooManyRequestsException' || e.code === 'NotFoundException') {
      await sleep(2000)
      return deployApiMapping(config, params)
    }
    if (e.code === 'ConflictException') {
      throw new Error(`The domain ${params.domain} is already in use by another API`)
    }
    throw e
  }
}

const getApiDomain = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  const getDomainNameParams = { DomainName: params.domain }

  const domain = await apig.getDomainName(getDomainNameParams).promise()

  return {
    apigatewayHostedZoneId: domain.DomainNameConfigurations[0].HostedZoneId,
    apigatewayDomainName: domain.DomainNameConfigurations[0].ApiGatewayDomainName
  }
}

const createApiDomain = async (config, params = {}) => {
  const apig = new AWS.ApiGatewayV2(config)

  let domain
  try {
    const createDomainNameParams = {
      DomainName: params.domain,
      DomainNameConfigurations: [
        {
          EndpointType: 'REGIONAL', // ApiGateway V2 does not support EDGE endpoints yet (Writte in April 9th 2020)
          SecurityPolicy: 'TLS_1_2',
          CertificateArn: params.certificateArn
        }
      ]
    }
    domain = await apig.createDomainName(createDomainNameParams).promise()
  } catch (e) {
    if (e.code === 'TooManyRequestsException') {
      await sleep(2000)
      return createApiDomain(config, params)
    }
    throw e
  }

  await deployApiMapping(config, params)

  return {
    apigatewayHostedZoneId: domain.DomainNameConfigurations[0].HostedZoneId,
    apigatewayDomainName: domain.DomainNameConfigurations[0].ApiGatewayDomainName
  }
}

const deployApiDomainDns = async (config, params = {}) => {
  const { domain, apigatewayHostedZoneId, apigatewayDomainName, domainHostedZoneId } = params

  const route53 = new AWS.Route53(config)

  const dnsRecordParams = {
    HostedZoneId: domainHostedZoneId,
    ChangeBatch: {
      Changes: [
        {
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: domain,
            Type: 'A',
            AliasTarget: {
              HostedZoneId: apigatewayHostedZoneId,
              DNSName: apigatewayDomainName,
              EvaluateTargetHealth: false
            }
          }
        }
      ]
    }
  }

  await route53.changeResourceRecordSets(dnsRecordParams).promise()

  return { domainHostedZoneId }
}

const deployApiDomain = async (config, params = {}) => {
  const { certificateArn, certificateStatus, domainHostedZoneId } = await deployCertificate(
    config,
    params
  )

  params.certificateArn = certificateArn
  params.domainHostedZoneId = domainHostedZoneId

  let domain
  try {
    domain = await getApiDomain(config, params)
  } catch (e) {
    if (e.code !== 'NotFoundException') {
      throw e
    }

    if (certificateArn && certificateStatus === 'ISSUED' && domainHostedZoneId) {
      domain = await createApiDomain(config, params)

      params.apigatewayHostedZoneId = domain.apigatewayHostedZoneId
      params.apigatewayDomainName = domain.apigatewayDomainName
      await deployApiDomainDns(config, params)
    }
  }

  return {
    domain: `https://${params.domain}`
  }
}

const deployApi = async (config, params = {}) => {
  config.region = config.region || 'us-east-1'

  let outputs

  if (params.apiId) {
    try {
      outputs = await updateApi(config, params)
    } catch (error) {
      if (error.code !== 'NotFoundException') {
        throw error
      }

      outputs = await createApi(config, params)
    }
  } else {
    outputs = await createApi(config, params)
  }

  if (params.domain) {
    const { domain } = await deployApiDomain(config, params)

    outputs.domain = domain
  }

  return outputs
}

module.exports = deployApi
