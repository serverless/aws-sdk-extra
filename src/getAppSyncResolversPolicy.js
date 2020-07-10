const getLambdaArn = require('./getLambdaArn')
const getTableArn = require('./getTableArn')
const getElasticSearchArn = require('./getElasticSearchArn')
const getRdsArn = require('./getRdsArn')

module.exports = async (config, params) => {
  const resolvers = params
  const policy = []

  for (const type in resolvers) {
    for (const field in resolvers[type]) {
      const resolver = resolvers[type][field]

      if (resolver.lambda) {
        // lambda
        const lambdaArn = `${await getLambdaArn(config, { lambdaName: resolver.lambda })}*`
        policy.push({
          Effect: 'Allow',
          Action: ['lambda:invokeFunction'],
          Resource: lambdaArn
        })
      } else if (resolver.table) {
        // dynamodb
        const tableArn = await getTableArn(config, { tableName: resolver.table })
        policy.push({
          Effect: 'Allow',
          Action: [
            'dynamodb:DeleteItem',
            'dynamodb:GetItem',
            'dynamodb:PutItem',
            'dynamodb:Query',
            'dynamodb:Scan',
            'dynamodb:UpdateItem',
            'dynamodb:BatchGetItem',
            'dynamodb:BatchWriteItem'
          ],
          Resource: `${tableArn}*`
        })
      } else if (resolver.endpoint) {
        // elastic search
        const elasticSearchArn = await getElasticSearchArn(config, {
          endpoint: resolver.endpoint
        })

        policy.push({
          Effect: 'Allow',
          Action: [
            'es:ESHttpDelete',
            'es:ESHttpGet',
            'es:ESHttpHead',
            'es:ESHttpPost',
            'es:ESHttpPut'
          ],
          Resource: elasticSearchArn
        })
      } else if (resolver.relationalDatabaseSourceType) {
        // relational database
        const rdsArn = await getRdsArn(config, {
          dbClusterIdentifier: resolver.dbClusterIdentifier
        })

        policy.push({
          Effect: 'Allow',
          Action: [
            'rds-data:DeleteItems',
            'rds-data:ExecuteSql',
            'rds-data:ExecuteStatement',
            'rds-data:GetItems',
            'rds-data:InsertItems',
            'rds-data:UpdateItems'
          ],
          Resource: `${rdsArn}*`
        })

        policy.push({
          Effect: 'Allow',
          Action: ['secretsmanager:GetSecretValue'],
          Resource: `${resolver.awsSecretStoreArn}*`
        })
      }
    }
  }

  return policy
}
