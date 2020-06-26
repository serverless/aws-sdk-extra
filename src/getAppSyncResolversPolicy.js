module.exports = async (aws, params) => {
  const resolvers = params
  const policy = []

  for (const type in resolvers) {
    for (const field in resolvers[type]) {
      const resolver = resolvers[type][field]

      if (resolver.lambda) {
        // lambda
        const lambdaArn = `${await aws.utils.getLambdaArn({ lambdaName: resolver.lambda })}*`
        policy.push({
          Effect: 'Allow',
          Action: ['lambda:invokeFunction'],
          Resource: lambdaArn
        })
      } else if (resolver.table) {
        // dynamodb
        const tableArn = await aws.utils.getTableArn({ tableName: resolver.table })
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
        const elasticSearchArn = await aws.utils.getElasticSearchArn({
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
        const rdsArn = await aws.utils.getRdsArn({
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
