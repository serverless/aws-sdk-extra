const aws = require('aws-sdk')
aws.utils = {}

aws.utils.deployCertificate = (params) => require('./deployCertificate')(aws, params)
aws.utils.deployDistributionDns = (params) => require('./deployDistributionDns')(aws, params)

module.exports = aws
