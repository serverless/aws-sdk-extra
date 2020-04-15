const aws = require('aws-sdk')
aws.utils = {}

aws.utils.ensureCertificate = (params) => require('./ensureCertificate')(aws, params)

module.exports = aws
