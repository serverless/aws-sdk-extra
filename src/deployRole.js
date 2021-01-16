const AWS = require('aws-sdk')
const removeRolePolicies = require('./removeRolePolicies.js')

const updateRolePolicy = async (config, params = {}) => {
  const iam = new AWS.IAM(config)

  // clear previously deployed policy arns if any
  await removeRolePolicies(config, params)

  if (typeof params.policy === 'string') {
    // policy is an arn of a managed policy
    await iam
      .attachRolePolicy({
        RoleName: params.roleName,
        PolicyArn: params.policy
      })
      .promise()
  } else {
    // Otherwise, create an inline policy

    // Policies can either be a full policy object or an array of Statements.
    let policyDocument
    if (Array.isArray(params.policy)) {
      policyDocument = {
        Version: '2012-10-17',
        Statement: params.policy
      }
    } else if (params.policy.Statement) {
      policyDocument = params.policy
    } else {
      throw new Error(
        'Invalid "policy" param.  This can either be a standard IAM Policy object, or an array of Statements to be included in a larger policy object.'
      )
    }

    await iam
      .putRolePolicy({
        RoleName: params.roleName,
        PolicyName: params.roleName,
        PolicyDocument: JSON.stringify(policyDocument)
      })
      .promise()
  }
}

const updateRole = async (config, params = {}) => {
  const iam = new AWS.IAM(config)

  const res = await iam.getRole({ RoleName: params.roleName }).promise()

  if (!params.assumeRolePolicyDocument) {
    params.assumeRolePolicyDocument = {
      Version: '2012-10-17',
      Statement: {
        Effect: 'Allow',
        Principal: {
          Service: params.service
        },
        Action: 'sts:AssumeRole'
      }
    }
  }

  await iam
    .updateAssumeRolePolicy({
      RoleName: params.roleName,
      PolicyDocument: JSON.stringify(params.assumeRolePolicyDocument)
    })
    .promise()

  await updateRolePolicy(config, params)

  return res.Role.Arn
}

const createRole = async (config, params = {}) => {
  const iam = new AWS.IAM(config)

  if (!params.assumeRolePolicyDocument) {
    params.assumeRolePolicyDocument = {
      Version: '2012-10-17',
      Statement: {
        Effect: 'Allow',
        Principal: {
          Service: params.service
        },
        Action: 'sts:AssumeRole'
      }
    }
  }

  const res = await iam
    .createRole({
      RoleName: params.roleName,
      Description: params.roleDescription || null,
      Path: '/',
      AssumeRolePolicyDocument: JSON.stringify(params.assumeRolePolicyDocument)
    })
    .promise()

  await updateRolePolicy(config, params)

  return res.Role.Arn
}

module.exports = async (config, params = {}) => {
  /**
   * Validate
   */
  if (!params.roleName) {
    throw new Error(`Missing "roleName" param.`)
  }

  params.service = params.service || 'lambda.amazonaws.com'
  params.policy = params.policy || 'arn:aws:iam::aws:policy/AdministratorAccess'

  // assumeRolePolicyDocument should cancel out "service"
  if (params.assumeRolePolicyDocument) {
    params.service = null
  }

  try {
    const roleArn = await updateRole(config, params)
    return { roleArn }
  } catch (e) {
    if (e.code === 'NoSuchEntity') {
      const roleArn = await createRole(config, params)
      return { roleArn }
    }
    throw e
  }
}
