const deployDistribution = require('./deployDistribution')

module.exports = async (config, params) => {
  const { domain, apiId, apiUrl } = params

  if (!apiId) {
    throw new Error(`Missing "apiId" param.`)
  }

  if (!apiUrl) {
    throw new Error(`Missing "apiUrl" param.`)
  }

  const deployDistributionParams = {
    domain,
    Origins: {
      Quantity: 1,
      Items: [
        {
          Id: apiId, // required
          DomainName: apiUrl.replace('https://', '').replace('/graphql', ''), // required
          OriginPath: '', // required
          CustomOriginConfig: {
            HTTPPort: 80,
            HTTPSPort: 443,
            OriginKeepaliveTimeout: 5,
            OriginProtocolPolicy: 'https-only',
            OriginReadTimeout: 30,
            OriginSslProtocols: {
              Items: ['SSLv3', 'TLSv1', 'TLSv1.1', 'TLSv1.2'],
              Quantity: 4
            }
          }
        }
      ]
    },
    DefaultCacheBehavior: {
      AllowedMethods: {
        Quantity: 7,
        Items: ['HEAD', 'GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
      },
      TrustedSigners: {
        // required
        Enabled: false,
        Quantity: 0,
        Items: []
      },
      ViewerProtocolPolicy: 'redirect-to-https', // required
      MinTTL: 0, // required
      DefaultTTL: 86400,
      MaxTTL: 31536000,
      SmoothStreaming: false,
      TargetOriginId: apiId, // required
      ForwardedValues: {
        QueryString: false, // required
        Cookies: {
          // required
          Forward: 'none'
        }
      }
    }
  }

  if (params.distributionId) {
    deployDistributionParams.distributionId = params.distributionId
  }

  const distribution = await deployDistribution(config, deployDistributionParams)

  return distribution
}
