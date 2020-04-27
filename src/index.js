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
aws.utils.updateOrCreateRole = (params) => require('./updateOrCreateRole')(aws, params)

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

module.exports = aws
