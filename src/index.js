const aws = require('aws-sdk')
aws.utils = {}

/*
 * Deploys a CloudFront distribution domain by adding the domain
 * to the distribution and deploying the certificate and DNS records.
 *
 * @param {distributionId} String - The targeted distribution id
 * @param {domain} String - The desired domain or subdomain
 *
 * @returns {certificateArn} String - The ARN of the created certificate
 * @returns {certificateStatus} String - The status of the created certificate
 * @returns {domainHostedZoneId} String - The Hosted Zone ID of the given domain
 */
aws.utils.deployDistributionDomain = (params) => require('./deployDistributionDomain')(aws, params)

/*
 * Deploys a free ACM certificate for the given domain
 *
 * @param {domain} String - The desired domain or subdomain
 *
 * @returns {certificateArn} String - The ARN of the created certificate
 * @returns {certificateStatus} String - The status of the created certificate
 * @returns {domainHostedZoneId} String - The Hosted Zone ID of the given domain
 */
aws.utils.deployCertificate = (params) => require('./deployCertificate')(aws, params)

/*
 * Deploys a DNS records for a distribution domain
 *
 * @param {domain} String - The desired domain or subdomain
 * @param {distributionUrl} String - The URL of the targeted distribuiton
 *
 * @returns {domainHostedZoneId} String - The Hosted Zone ID of the given domain
 */
aws.utils.deployDistributionDns = (params) => require('./deployDistributionDns')(aws, params)

/*
 * Fetches the hosted zone id for the given domain
 *
 * @param {domain} String - The targeted domain or sub domain
 *
 * @returns {domainHostedZoneId} String - The Hosted Zone ID of the given domain
 */
aws.utils.getDomainHostedZoneId = (params) => require('./getDomainHostedZoneId')(aws, params)

/*
 * Adds a domain or subdomain to a CloudFront Distribution
 *
 * @param {domain} String - The desired domain or sub domain
 * @param {certificateArn} String - The certificate ARN of the desired domain
 * @param {certificateStatus} String - The certificate status of the desired domain
 *
 * @returns {domainHostedZoneId} String - The Hosted Zone ID of the given domain
 */
aws.utils.addDomainToDistribution = (params) => require('./addDomainToDistribution')(aws, params)

/*
 * Updates or creates the given role name with the given service & policy
 *
 *
 * @param {name} String - The name of the role
 * @param {service} String/Array - The service that will assume this role. Default is lambda.
 * @param {policy} String/Array - The managed policy arn as a string, or an array of inline policy statements
 *
 * @returns {roleArn} String - The arn of the created/update role
 */
aws.utils.deployRole = (params) => require('./deployRole')(aws, params)

/*
 * Deletes the given role and all its attached managed and inline policies
 *
 *
 * @param {name} String - The name of the role to delete
 *
 */
aws.utils.deleteRole = (params) => require('./deleteRole')(aws, params)

/*
 * Deletes all attached managed and inline policies for the given role
 *
 *
 * @param {name} String - The name of the role to delete policies from
 *
 */
aws.utils.deleteRolePolicies = (params) => require('./deleteRolePolicies')(aws, params)

/*
 * Updates a lambda if it exists, otherwise creates a new one.
 *
 *
 * @param {lambdaName} String - required - The name of the targeted lambda
 * @param {roleArn} String - required - The role arn you'd like the lambda to assume
 * @param {lambdaSrc} String/Buffer - required - The source code of the lambda either as a path to a directory or a buffer
 *
 * @returns {lambdaArn} String - The ARN of the updated/created lambda
 * @returns {lambdaSize} Number - The code size of the update/created lambda
 * @returns {lambdaSha} String - The sha hash of the update/created lambda
 *
 */
aws.utils.deployLambda = (params) => require('./deployLambda')(aws, params)

/*
 * Deploys the DNS records for an Api Gateway V2 HTTP custom domain
 *
 *
 * @param {domain} String - required - The domain name you'd like to configure.
 * @param {apigatewayHostedZoneId} String - required - The regional hosted zone id of the APIG custom domain.
 * @param {apigatewayDomainName} String - required - The regional endpoint of the APIG custom domain.
 *
 * @returns {domainHostedZoneId} String - The hosted zone id of the provided domain
 *
 */
aws.utils.deployApigDomainDns = (params) => require('./deployApigDomainDns')(aws, params)

// todo document
aws.utils.deployAppSyncApi = (params) => require('./deployAppSyncApi')(aws, params)
aws.utils.deployAppSyncSchema = (params) => require('./deployAppSyncSchema')(aws, params)
aws.utils.deployAppSyncResolvers = (params) => require('./deployAppSyncResolvers')(aws, params)
aws.utils.getAppSyncResolversPolicy = (params) =>
  require('./getAppSyncResolversPolicy')(aws, params)
aws.utils.createAppSyncApiKey = (params) => require('./createAppSyncApiKey')(aws, params)
aws.utils.getAccountId = (params) => require('./getAccountId')(aws, params)
aws.utils.getLambdaArn = (params) => require('./getLambdaArn')(aws, params)
aws.utils.getRoleArn = (params) => require('./getRoleArn')(aws, params)
aws.utils.getTableArn = (params) => require('./getTableArn')(aws, params)
aws.utils.getElasticSearchArn = (params) => require('./getElasticSearchArn')(aws, params)
aws.utils.getRdsArn = (params) => require('./getRdsArn')(aws, params)
aws.utils.getCloudWatchLogGroupArn = (params) => require('./getCloudWatchLogGroupArn')(aws, params)
aws.utils.deleteLambda = (params) => require('./deleteLambda')(aws, params)
aws.utils.deleteAppSyncApi = (params) => require('./deleteAppSyncApi')(aws, params)
aws.utils.deployAppSyncApiKey = (params) => require('./deployAppSyncApiKey')(aws, params)
aws.utils.deployAppSyncDistribution = (params) =>
  require('./deployAppSyncDistribution')(aws, params)
aws.utils.deployDistribution = (params) => require('./deployDistribution')(aws, params)
aws.utils.disableDistribution = (params) => require('./disableDistribution')(aws, params)
aws.utils.removeDistribution = (params) => require('./removeDistribution')(aws, params)

module.exports = aws
