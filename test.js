const AWS = require('./src')

const ex = new AWS.Extras()

const test = async () => {
  const res = await ex.listAllCloudFormationStacksInARegion({ region: 'us-east-1' })
}

test().catch((error) => { console.log(error) })

