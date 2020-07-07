const aws = require('aws-sdk')
aws.utils = {}

/*
 * Deploys a CloudFront distribution domain by adding the domain
 */
aws.utils.deployDistributionDomain = (params) => require('./deployDistributionDomain')(aws, params)

/*
 * Deploys a free ACM certificate for the given domain
 */
aws.utils.deployCertificate = (params) => require('./deployCertificate')(aws, params)

/*
 * Deploys a DNS records for a distribution domain
 */
aws.utils.deployDistributionDns = (params) => require('./deployDistributionDns')(aws, params)

/*
 * Fetches the hosted zone id for the given domain
 */
aws.utils.getDomainHostedZoneId = (params) => require('./getDomainHostedZoneId')(aws, params)

/*
 * Adds a domain or subdomain to a CloudFront Distribution
 */
aws.utils.addDomainToDistribution = (params) => require('./addDomainToDistribution')(aws, params)

/*
 * Updates or creates the given role name with the given service & policy
 */
aws.utils.deployRole = (params) => require('./deployRole')(aws, params)

/*
 * Deletes the given role and all its attached managed and inline policies
 */
aws.utils.removeRole = (params) => require('./removeRole')(aws, params)

/*
 * Deletes all attached managed and inline policies for the given role
 */
aws.utils.removeRolePolicies = (params) => require('./removeRolePolicies')(aws, params)

/*
 * Updates a lambda if it exists, otherwise creates a new one.
 */
aws.utils.deployLambda = (params) => require('./deployLambda')(aws, params)

/*
 * Deploys the DNS records for an Api Gateway V2 HTTP custom domain
 */
aws.utils.deployApigDomainDns = (params) => require('./deployApigDomainDns')(aws, params)

/*
 * Updates or creates an AppSync API
 */
aws.utils.deployAppSyncApi = (params) => require('./deployAppSyncApi')(aws, params)

/*
 * Updates or creates an AppSync Schema
 */
aws.utils.deployAppSyncSchema = (params) => require('./deployAppSyncSchema')(aws, params)

/*
 * Updates or creates AppSync Resolvers
 */
aws.utils.deployAppSyncResolvers = (params) => require('./deployAppSyncResolvers')(aws, params)

/*
 * Generates the minimum IAM role policy that is required for the given resolvers.
 */
aws.utils.getAppSyncResolversPolicy = (params) =>
  require('./getAppSyncResolversPolicy')(aws, params)

/*
 * Returns the account id of the configured credentials
 */
aws.utils.getAccountId = (params) => require('./getAccountId')(aws, params)

/*
 * Constructs a Lambda ARN from the given Lambda name
 */
aws.utils.getLambdaArn = (params) => require('./getLambdaArn')(aws, params)

/*
 * Constructs an IAM Role ARN from the given Role name
 */
aws.utils.getRoleArn = (params) => require('./getRoleArn')(aws, params)

/*
 * Constructs Table ARN from the given Table name
 */
aws.utils.getTableArn = (params) => require('./getTableArn')(aws, params)

/*
 * Constructs ElasticSearch ARN from the given ElasticSearch domain
 */
aws.utils.getElasticSearchArn = (params) => require('./getElasticSearchArn')(aws, params)

/*
 * Constructs RDS ARN from the given dbClusterIdentifier
 */
aws.utils.getRdsArn = (params) => require('./getRdsArn')(aws, params)

/*
 * Constructs CloudWatch Log Group ARN from the given lambdaName or logGroupName
 */
aws.utils.getCloudWatchLogGroupArn = (params) => require('./getCloudWatchLogGroupArn')(aws, params)

/*
 * Removes a Lambda function. Does nothing if already removed.
 */
aws.utils.removeLambda = (params) => require('./removeLambda')(aws, params)

/*
 * Removes an AppSync API. Does nothing if already removed.
 */
aws.utils.removeAppSyncApi = (params) => require('./removeAppSyncApi')(aws, params)

/*
 * Creates an AppSync API Key that is valid for 1 year
 */
aws.utils.createAppSyncApiKey = (params) => require('./createAppSyncApiKey')(aws, params)

/*
 * Updates or creats an AppSync API Key
 */
aws.utils.deployAppSyncApiKey = (params) => require('./deployAppSyncApiKey')(aws, params)

/*
 * Updates or creats a CloudFront distribution for AppSync API
 */
aws.utils.deployAppSyncDistribution = (params) =>
  require('./deployAppSyncDistribution')(aws, params)

/*
 * Updates or creats a CloudFront distribution
 */
aws.utils.deployDistribution = (params) => require('./deployDistribution')(aws, params)

/*
 * Disables a CloudFront distribution
 */
aws.utils.disableDistribution = (params) => require('./disableDistribution')(aws, params)

/*
 * Removes a CloudFront distribution. If distribution is enabled, it just disables it.
 * If distribution is already disabled, it removes it completely.
 */
aws.utils.removeDistribution = (params) => require('./removeDistribution')(aws, params)

/*
 * Export everything
 */
module.exports = aws
