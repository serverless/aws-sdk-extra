module.exports = async (aws) => {
  const sts = new aws.STS()

  const res = await sts.getCallerIdentity({}).promise()

  return res.Account
}
