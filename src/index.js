const AWS = require('aws-sdk')
const deployDistributionDomain = require('./deployDistributionDomain')
const deployCertificate = require('./deployCertificate')
const deployDistributionDns = require('./deployDistributionDns')
const getDomainHostedZoneId = require('./getDomainHostedZoneId')
const addDomainToDistribution = require('./addDomainToDistribution')
const deployRole = require('./deployRole')
const getRole = require('./getRole')
const removeRole = require('./removeRole')
const removeRolePolicies = require('./removeRolePolicies')
const deployLambda = require('./deployLambda')
const deployApigDomainDns = require('./deployApigDomainDns')
const deployAppSyncApi = require('./deployAppSyncApi')
const deployAppSyncSchema = require('./deployAppSyncSchema')
const deployAppSyncResolvers = require('./deployAppSyncResolvers')
const getAppSyncResolversPolicy = require('./getAppSyncResolversPolicy')
const getAccountId = require('./getAccountId')
const getLambdaArn = require('./getLambdaArn')
const getRoleArn = require('./getRoleArn')
const getTableArn = require('./getTableArn')
const getElasticSearchArn = require('./getElasticSearchArn')
const getRdsArn = require('./getRdsArn')
const getCloudWatchLogGroupArn = require('./getCloudWatchLogGroupArn')
const removeLambda = require('./removeLambda')
const removeAppSyncApi = require('./removeAppSyncApi')
const createAppSyncApiKey = require('./createAppSyncApiKey')
const deployAppSyncApiKey = require('./deployAppSyncApiKey')
const deployAppSyncDistribution = require('./deployAppSyncDistribution')
const deployDistribution = require('./deployDistribution')
const disableDistribution = require('./disableDistribution')
const removeDistribution = require('./removeDistribution')
const getMetrics = require('./getMetrics')

/**
 * Define AWS Extras class
 * @param {*} params 
 */

class Extras {

  constructor(config = {}) {
    this.config = config
  }

  /**
   * A convenience function to fetch useful metrics from AWS Cloudwatch for one or many AWS
   * resources (e.g. AWS HTTP API, AWS Lambda), and transform their resulting data into
   * the standard format that is supported by Serverless Framework Component metrics.
   *
   * @param {string} params.region AWS region
   * @param {string} params.rangeStart ISO8601 timestamp for the start of the date range to query within
   * @param {string} params.rangeEnd ISO8601 timestamp for the end of the date range to query within
   * @param {array} params.resources An array containing objects representing AWS resources to query against.  View examples for supported resources.
   *
   * @example
   *
   * // AWS HTTP API
   * {
   *   type: 'aws_http_api',
   *   apiId: 'j0jafsasf',
   * }
   *
   * // AWS Lambda
   * {
   *   type: 'aws_lambda',
   *   functionName: 'myLambdaFunction',
   * }
   * 
   * // AWS Cloudfront
   * {
   *   type: 'aws_cloudfront',
   *   distributionId: 'ja9fa9j1',
   * }
   *
   */
  getMetrics(params) { return getMetrics(this.config, params) }

  /**
   * Deploys a CloudFront distribution domain by adding the domain
   */
  deployDistributionDomain(params) { return deployDistributionDomain(this.config, params) }

  /**
   * Deploys a free ACM certificate for the given domain
   */
  deployCertificate(params) { return deployCertificate(this.config, params) }

  /** 
   * Deploys a DNS records for a distribution domain
   */
  deployDistributionDns(params) { return deployDistributionDns(this.config, params) }

  /**
   * Fetches the hosted zone id for the given domain
   */
  getDomainHostedZoneId(params) { return getDomainHostedZoneId(this.config, params) }

  /**
   * Adds a domain or subdomain to a CloudFront Distribution
   */
  addDomainToDistribution(params) { return addDomainToDistribution(this.config, params) }

  /**
   * Updates or creates an IAM Role and Policy
   * @param {*} params.roleName The name of the IAM Role
   * @param {*} params.roleDescription A description for the role
   * @param {*} params.roleTags Tags for the role
   * @param {*} params.policy The policy to inline or attach to the role.  If you provide a string of an AWS IAM Managed Policy ARN, it will attach it.  If you provide an array or object it will inline the policy into the Role.
   * @param {*} params.service The "Service" section of the assumeRolePolicyDocument
   * @param {*} params.assumeRolePolicyDocument The assumeRolePolicyDocument.  Overrides params.service
   */
  deployRole(params) { return deployRole(this.config, params) }

  /**
   * Get an AWS IAM Role, its tags, inline policies and managed policies
   * @param {*} params.roleName The name of the IAM Role you want to remove
   */
  getRole(params) { return getRole(this.config, params) }

  /**
  * Deletes the given role and all its attached managed and inline policies
   */
  removeRole(params) { return removeRole(this.config, params) }

  /**
   * Deletes all attached managed and inline policies for the given role
   */
  removeRolePolicies(params) { return removeRolePolicies(this.config, params) }

  /**
   * Updates a lambda if it exists, otherwise creates a new one.
   */
  deployLambda(params) { return deployLambda(this.config, params) }

  /**
   * Deploys the DNS records for an Api Gateway V2 HTTP custom domain
   */
  deployApigDomainDns(params) { return deployApigDomainDns(this.config, params) }

  /**
   * Updates or creates an AppSync API
   */
  deployAppSyncApi(params) { return deployAppSyncApi(this.config, params) }

  /**
   * Updates or creates an AppSync Schema
   */
  deployAppSyncSchema(params) { return deployAppSyncSchema(this.config, params) }

  /**
   * Updates or creates AppSync Resolvers
   */
  deployAppSyncResolvers(params) { return deployAppSyncResolvers(this.config, params) }

  /**
   * Generates the minimum IAM role policy that is required for the given resolvers.
   */
  getAppSyncResolversPolicy(params) { return getAppSyncResolversPolicy(this.config, params) }

  /**
   * Returns the account id of the configured credentials
   */
  getAccountId(params) { return getAccountId(this.config, params) }

  /**
   * Constructs a Lambda ARN from the given Lambda name
   */
  getLambdaArn(params) { return getLambdaArn(this.config, params) }

  /**
   * Constructs an IAM Role ARN from the given Role name
   */
  getRoleArn(params) { return getRoleArn(this.config, params) }

  /**
   * Constructs Table ARN from the given Table name
   */
  getTableArn(params) { return getTableArn(this.config, params) }

  /**
   * Constructs ElasticSearch ARN from the given ElasticSearch domain
   */
  getElasticSearchArn(params) { return getElasticSearchArn(this.config, params) }

  /**
   * Constructs RDS ARN from the given dbClusterIdentifier
   */
  getRdsArn(params) { return getRdsArn(this.config, params) }

  /**
   * Constructs CloudWatch Log Group ARN from the given lambdaName or logGroupName
   */
  getCloudWatchLogGroupArn(params) { return getCloudWatchLogGroupArn(this.config, params) }

  /**
   * Removes a Lambda function. Does nothing if already removed.
   */
  removeLambda(params) { return removeLambda(this.config, params) }

  /**
   * Removes an AppSync API. Does nothing if already removed.
   */
  removeAppSyncApi(params) { return removeAppSyncApi(this.config, params) }

  /**
   * Creates an AppSync API Key that is valid for 1 year
   */
  createAppSyncApiKey(params) { return createAppSyncApiKey(this.config, params) }

  /**
   * Updates or creats an AppSync API Key
   */
  deployAppSyncApiKey(params) { return deployAppSyncApiKey(this.config, params) }

  /**
   * Updates or creats a CloudFront distribution for AppSync API
   */
  deployAppSyncDistribution(params) { return deployAppSyncDistribution(this.config, params) }

  /**
   * Updates or creats a CloudFront distribution for AppSync API
   */
  deployDistribution(params) { return deployDistribution(this.config, params) }

  /**
   * Disables a CloudFront distribution
   */
  disableDistribution(params) { return disableDistribution(this.config, params) }

  /**
   * Removes a CloudFront distribution. If distribution is enabled, it just disables it.
   * If distribution is already disabled, it removes it completely.
   */
  removeDistribution(params) { return removeDistribution(this.config, params) }

}

/**
 * Export
 */

AWS.Extras = Extras;
module.exports = AWS;