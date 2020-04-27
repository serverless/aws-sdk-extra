const aws = require('../src')

;(async () => {
  const params = {
    name: 'testing-role',
    service: 'lambda.amazonaws.com',
    policy: [
      {
        Effect: 'Allow',
        Action: ['sts:AssumeRole'],
        Resource: '*'
      },
      {
        Effect: 'Allow',
        Action: ['logs:CreateLogGroup', 'logs:CreateLogStream'],
        Resource: '*'
      }
    ]
  }
  const role = await aws.utils.updateOrCreateRole(params)

  console.log(role)
})()
