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

module.exports = aws
