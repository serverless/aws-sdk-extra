const moment = require('moment')

module.exports = async (
  aws,
  {
    credentials,
    region,
    rangeStart,
    rangeEnd,
    resources,
  }) => {

  const cloudwatch = new aws.CloudWatch({ credentials, region });

  /**
   * Validate parameters
   */

  rangeStart = rangeStart || moment.utc().toISOString()
  rangeEnd = rangeEnd || moment.utc().subtract(1, 'days').toISOString()
  resources = resources || []

  // Ensure resources were submitted
  if (!resources.length) {
    throw new Error(`You provided no resources to fetch queries from`)
  }

  // Validate: ISO8601 timestamps
  if (!moment(rangeStart, moment.ISO_8601).isValid()) {
    throw new Error(`Param "rangeStart" is not a valid IS)8601 timestamp: ${rangeStart}`);
  }
  if (!moment(rangeEnd, moment.ISO_8601).isValid()) {
    throw new Error(`Param "rangeEnd" is not a valid IS)8601 timestamp: ${rangeEnd}`);
  }

  // Convert to Moment.js objects
  rangeStart = moment.utc(rangeStart);
  rangeEnd = moment.utc(rangeEnd);

  // Validate: Start is before End
  if (rangeStart.isAfter(rangeEnd)) {
    throw new Error('The "rangeStart" provided is after the "rangeEnd"');
  }

  // Validate: End is not longer than 30 days
  if (rangeStart.diff(rangeEnd, 'days') > 32) {
    throw new Error(
      `The range cannot be longer than 32 days.  The supplied range is: ${rangeStart.diff(
        rangeEnd,
        'days'
      )}`
    );
  }

  /**
   * Prepare Response by determining query time range length, 
   * the unit of time that's most relevant (minutes, hours, days), 
   * and creating default values for each bucket of time within the time range, 
   * since Cloudwatch does not return every timestamp within a given
   * time range, only if they have values.
   * 
   * It's important that we use the same unit of time as Cloudwatch
   * and bucket values by that unit of time.
   * 
   * Later, we'll add Cloudwatch's returned data into our defaults by comparing 
   * timestamps returned from Cloudwatch against our default values.  The timestamps
   * in each bucket must match, or we will not be able to accurately add in Cloduwatch's
   * returned data into our defaults.
   * 
   */

  let period;
  let timeBuckets;
  const xData = [];
  const yData = [];
  const diffMinutes = Math.ceil(rangeEnd.diff(rangeStart, 'minutes', true)); // 'true' returns decimals

  // Length: 0 mins - 2 hours
  if (diffMinutes <= 120) {
    period = 60;
    rangeStart = rangeStart.startOf('minute');
    rangeEnd = rangeEnd.endOf('minute');
    timeBuckets = rangeEnd.diff(rangeStart, 'minutes');
    // Create values
    for (let i = 0; i <= timeBuckets; i++) {
      xData.push(rangeStart.clone().add(i, 'minutes').toISOString());
      yData.push(0);
    }
  }
  // Length: 2 hours - 48 hours
  else if (diffMinutes > 120 && diffMinutes <= 2880) {
    period = 3600;
    rangeStart = rangeStart.startOf('hour');
    rangeEnd = rangeEnd.endOf('hour');
    timeBuckets = rangeEnd.diff(rangeStart, 'hours');
    // Create values
    for (let i = 0; i <= timeBuckets; i++) {
      xData.push(rangeStart.clone().add(i, 'hours').toISOString());
      yData.push(0);
    }
  }
  // Length: 48 hours to 32 days
  else if (diffMinutes > 2880) {
    period = 86400;
    rangeStart = rangeStart.startOf('day');
    rangeEnd = rangeEnd.endOf('day');
    timeBuckets = rangeEnd.diff(rangeStart, 'days');
    // Create values
    for (let i = 0; i <= timeBuckets; i++) {
      xData.push(rangeStart.clone().add(i, 'days').toISOString());
      yData.push(0);
    }
  }

  /**
   * Get Cloudwatch Queries for each resource requested.
   * You can request up to 500 queries via 1 Cloudwatch.getMetricData call
   * This tries to get everything in one call...
   */

  let cloudwatchMetricQueries = []
  const resourcesUsed = {}
  resources.forEach((resource) => {

    // Check to ensure a valid resource type is used.
    if (Object.keys(resourceHandlers).indexOf(resource.type) < 0) {
      throw new Error(`Your metric query requested metrics from this AWS resource "${resource.type}" which is either not accurate or not currently supported by this function.`)
    }

    // Add queries for supported resource
    if (resourceHandlers[resource.type]) {
      cloudwatchMetricQueries = cloudwatchMetricQueries.concat(resourceHandlers[resource.type].queries(period, resource))
    }

    // Track which resources are used, so that we can use their transform functions
    // to convert their metrics to the standard Components format.
    resourcesUsed[resource.type] = true
  })

  // Check to ensure there aren't more than 500 metrics requests
  if (cloudwatchMetricQueries.length > 500) {
    throw new Error(`Your AWS Cloudwatch query contains ${cloudwatchMetricQueries.length} queries, but Cloudwatch can only support up to 500 queries.`)
  }

  // Prepare CloudWatch queries
  const params = {
    StartTime: rangeStart.unix(),
    EndTime: rangeEnd.unix(),
    // NextToken: null, // No need for this since we are restricting value counts.
    ScanBy: 'TimestampAscending',
    MetricDataQueries: cloudwatchMetricQueries
  }

  // Fetch data from Cloudwatch
  const data = await cloudwatch.getMetricData(params).promise();

  /**
   * Transform metrics to standard Components format and format response
   */

  const result = {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    metrics: [],
  };

  // Loop through each returned metric, transform results, and add to response
  data.MetricDataResults.forEach((cwMetric) => {

    // Create metric
    let metric = {};
    metric.type = 'bar-v1';
    metric.stat = null;
    metric.statText = null;
    metric.statColor = '#000000';
    metric.xData = xData.slice();
    metric.yDataSets = [{}];
    metric.yDataSets[0].yData = yData.slice();

    // Iterate and transform Cloudwatch metric data
    cwMetric.Timestamps.forEach((cwVal, i) => {

      // Add data which Cloudwatch has returned by inspecting timestamps of CW's returned data
      // If a timestamp exists that matches one of the defaults, add it in.
      metric.xData.forEach((xVal, i2) => {
        if (moment.utc(xVal).isSame(cwVal)) {
          metric.yDataSets[0].yData[i2] = cwMetric.Values[i];
        }
      });
    });

    // Transform data
    Object.keys(resourcesUsed).forEach((resourceType) => {
      metric = resourceHandlers[resourceType].transforms(cwMetric, metric)
    })

    // Add to results
    result.metrics.push(metric)
  })

  return result;
}




/**
 * Resource Handlers
 * 
 * These are the AWS resources this function supports.
 * These handlers return pre-made CloudWatch queries for the resource,
 * as well as transform logic to convert the resulting data into the 
 * Serverless Framework Component output types data.
 */

const resourceHandlers = {}

/**
 * AWS HTTP API
 */

resourceHandlers.aws_http_api = {}

/**
 * AWS HTTP API Cloudwatch queries
 * @param {*} period 
 * @param {*} apiId 
 */
resourceHandlers.aws_http_api.queries = (period, { apiId, stage }) => {

  if (!period || !apiId) {
    throw new Error(`Missing required params`)
  }

  return [{
    Id: 'api_requests',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Count',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'api_errors_500',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: '5xx',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'api_errors_400',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: '4xx',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'api_latency',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Latency',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Average',
    },
  },
  {
    Id: 'api_data_processed',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'DataProcessed',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'api_integration_latency',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'IntegrationLatency',
        Namespace: 'AWS/ApiGateway',
        Dimensions: [
          {
            Name: 'Stage',
            Value: stage || '$default',
          },
          {
            Name: 'ApiId',
            Value: apiId,
          },
        ],
      },
      Period: period,
      Stat: 'Average',
    },
  }]
}

/**
 * AWS HTTP API Cloudwatch transforms
 * @param {*} period 
 * @param {*} apiId 
 */
resourceHandlers.aws_http_api.transforms = (cwMetric, metric) => {

  if (!cwMetric || !metric) {
    throw new Error(`Missing required params`)
  }

  // Total Requests
  if (cwMetric.Id === 'api_requests') {
    metric.title = 'API Requests';
    metric.description =
      'The total number API requests in a given period to your AWS HTTP API.';
    metric.yDataSets[0].color = '#000000';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  // Errors - 5xx
  if (cwMetric.Id === 'api_errors_500') {
    metric.title = 'API Errors - 5xx';
    metric.description =
      'The number of serverless-side internal errors captured in a given period from your AWS HTTP API most likely generated as a result of issues within your code.';
    metric.statColor = '#FE5850';
    metric.yDataSets[0].color = '#FE5850';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  // Errors - 4xx
  if (cwMetric.Id === 'api_errors_400') {
    metric.title = 'API Errors - 4xx';
    metric.description =
      'The number of serverless-side client-generated errors captured in a given period from your AWS HTTP API.';
    metric.statColor = '#FE5850';
    metric.yDataSets[0].color = '#FE5850';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  // Latency
  if (cwMetric.Id === 'api_latency') {
    metric.title = 'API Latency';
    metric.description =
      'The time between when AWS HTTP API receives a request from a client and when it returns a response to the client. The latency includes the integration latency and other AWS HTTP API overhead.';
    metric.statColor = '#029CE3';
    metric.yDataSets[0].color = '#029CE3';
    // Round decimals
    metric.yDataSets[0].yData = metric.yDataSets[0].yData.map((val) => Math.ceil(val));
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
    // Get average
    const filtered = metric.yDataSets[0].yData.filter((x) => x > 0);
    metric.stat = Math.ceil(metric.stat / filtered.length);
    metric.statText = 'ms';
  }

  // Integration Latency
  if (cwMetric.Id === 'api_integration_latency') {
    metric.title = 'API Integration Latency';
    metric.description =
      'The time between when AWS HTTP API relays a request to the backend and when it receives a response from the backend.';
    metric.statColor = '#029CE3';
    metric.yDataSets[0].color = '#029CE3';
    // Round decimals
    metric.yDataSets[0].yData = metric.yDataSets[0].yData.map((val) => Math.ceil(val));
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
    // Get average
    const filtered = metric.yDataSets[0].yData.filter((x) => x > 0);
    metric.stat = Math.ceil(metric.stat / filtered.length);
    metric.statText = 'ms';
  }

  // Data Processed in Kilobytes
  if (cwMetric.Id === 'api_data_processed') {
    metric.title = 'API Data Processed';
    metric.description = 'The amount of data processed in kilobytes.';
    metric.statColor = '#000000';
    metric.yDataSets[0].color = '#000000';
    // Convert to kilobytes
    metric.yDataSets[0].yData = metric.yDataSets[0].yData.map((val) => {
      const kb = val / Math.pow(1024, 1);
      return Math.round(kb * 100) / 100;
    });
    // Get sum of bytes
    metric.statText = 'kb';
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  return metric
}

/**
 * AWS Lambda
 */

resourceHandlers.aws_lambda = {}

/**
 * AWS Lambda Cloudwatch queries
 * @param {*} period 
 * @param {*} resource.functionName 
 */
resourceHandlers.aws_lambda.queries = (period, { functionName }) => {

  if (!period || !functionName) {
    throw new Error(`Missing required params`)
  }

  return [{
    Id: 'function_invocations',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Invocations',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'function_errors',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'function_throttles',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
      },
      Period: period,
      Stat: 'Sum',
    },
  },
  {
    Id: 'function_duration',
    ReturnData: true,
    MetricStat: {
      Metric: {
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Dimensions: [
          {
            Name: 'FunctionName',
            Value: functionName,
          },
        ],
      },
      Period: period,
      Stat: 'Average',
    },
  }]
}

/**
 * AWS Lambda Cloudwatch transforms
 * @param {*} period 
 * @param {*} resource.functionName 
 */
resourceHandlers.aws_lambda.transforms = (cwMetric, metric) => {

  if (!cwMetric || !metric) {
    throw new Error(`Missing required params`)
  }

  // Function Invocations
  if (cwMetric.Id === 'function_invocations') {
    metric.title = 'Function Invocations';
    metric.description =
      'The number of times your function code is executed, including successful executions and executions that result in a function error. Invocations are not recorded if the invocation request is throttled or otherwise resulted in an invocation error. This equals the number of requests billed.';
    metric.yDataSets[0].color = '#000000';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }
  // Function Errors
  if (cwMetric.Id === 'function_errors') {
    metric.title = 'Function Errors';
    metric.description =
      'The number of invocations that result in a function error. Function errors include exceptions thrown by your code and exceptions thrown by the Lambda runtime. The runtime returns errors for issues such as timeouts and configuration errors. To calculate the error rate, divide the value of Errors by the value of Invocations.';
    metric.yDataSets[0].color = '#FE5850';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  // Function Throttles
  if (cwMetric.Id === 'function_throttles') {
    metric.title = 'Function Throttles';
    metric.description =
      'The number of invocation requests that are throttled. When all function instances are processing requests and no concurrency is available to scale up, Lambda rejects additional requests with TooManyRequestsException. Throttled requests and other invocation errors do not count as Invocations or Errors.';
    metric.yDataSets[0].color = '#FE5850';
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
  }

  // Function Latency
  if (cwMetric.Id === 'function_duration') {
    metric.title = 'Function Latency';
    metric.description =
      'The amount of time that your function code spends processing an event. For the first event processed by an instance of your function, this includes initialization time. The billed duration for an invocation is the value of Duration rounded up to the nearest 100 milliseconds.';
    metric.yDataSets[0].color = '#029CE3';
    metric.statColor = '#029CE3';
    metric.statText = 'ms';
    // Round decimals
    metric.yDataSets[0].yData = metric.yDataSets[0].yData.map((val) => Math.ceil(val));
    // Get sum
    metric.stat = metric.yDataSets[0].yData.reduce((previous, current) => current + previous);
    // Get average
    const filtered = metric.yDataSets[0].yData.filter((x) => x > 0);
    metric.stat = Math.ceil(metric.stat / filtered.length);
  }

  return metric;
}