const aws = require('aws-sdk')
aws.utils = {}

aws.utils.getDomainHostedZoneId = (params) => require('./getDomainHostedZoneId')(aws, params)
aws.utils.ensureCertificate = (params) => require('./ensureCertificate')(aws, params)

module.exports = aws
