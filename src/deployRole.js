const deleteRolePolicies = require('./deleteRolePolicies')

const updateRolePolicy = async (aws, params = {}) => {
  const iam = new aws.IAM()

  // clear previously deployed policy arns if any
  await deleteRolePolicies(aws, params)

  if (typeof params.policy === 'string') {
    // policy is an arn of a managed policy
    await iam
      .attachRolePolicy({
        RoleName: params.roleName,
        PolicyArn: params.policy
      })
      .promise()
  } else if (params.policy.length) {
    // policy is an inline policy statement
    const policyDocument = {
      Version: '2012-10-17',
      Statement: params.policy
    }
    await iam
      .putRolePolicy({
        RoleName: params.roleName,
        PolicyName: params.roleName,
        PolicyDocument: JSON.stringify(policyDocument)
      })
      .promise()
  } else {
    throw new Error(`Invalid policy specified.`)
  }
}

const updateRole = async (aws, params = {}) => {
  const iam = new aws.IAM()

  const res = await iam.getRole({ RoleName: params.roleName }).promise()

  const assumeRolePolicyDocument = {
    Version: '2012-10-17',
    Statement: {
      Effect: 'Allow',
      Principal: {
        Service: params.service
      },
      Action: 'sts:AssumeRole'
    }
  }

  await iam
    .updateAssumeRolePolicy({
      RoleName: params.roleName,
      PolicyDocument: JSON.stringify(assumeRolePolicyDocument)
    })
    .promise()

  await updateRolePolicy(aws, params)

  return res.Role.Arn
}

const createRole = async (aws, params = {}) => {
  const iam = new aws.IAM()
  const assumeRolePolicyDocument = {
    Version: '2012-10-17',
    Statement: {
      Effect: 'Allow',
      Principal: {
        Service: params.service
      },
      Action: 'sts:AssumeRole'
    }
  }
  const res = await iam
    .createRole({
      RoleName: params.roleName,
      Path: '/',
      AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicyDocument)
    })
    .promise()

  await updateRolePolicy(aws, params)

  return res.Role.Arn
}

module.exports = async (aws, params = {}) => {
  if (!params.roleName) {
    throw new Error(`Missing "roleName" param.`)
  }

  params.service = params.service || 'lambda.amazonaws.com'
  params.policy = params.policy || 'arn:aws:iam::aws:policy/AdministratorAccess'

  try {
    const roleArn = await updateRole(aws, params)

    return { roleArn }
  } catch (e) {
    if (e.code === 'NoSuchEntity') {
      const roleArn = await createRole(aws, params)

      return { roleArn }
    }
    throw e
  }
}
