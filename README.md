# healthili

healthili is a simple, standalone and zero dependencies health check endpoint. If you have a worker service which does not expose a http API anyways, but you want to use a HTTP health check endpoint for your k8s / ec2 / fargate etc. healthili is for you.

Healthili is compliant with the IETF Draft [Health Check Response Format for HTTP APIs](https://tools.ietf.org/html/draft-inadarei-api-health-check-04).

## how to use
```js
const healthili = require('healthili');

const healthEndpoint = healthili.createEndpoint(() => true);
```

This will create a simple http server listening on port `3000` with the health endpoint at `/health`. If the health function given to `createEndpoint` returns `true` or `"pass"` the endpoint will return a `200 OK` with a minimal payload:

```js
// 200
{
  status: 'pass', 
}
```

If the health function returns `false` or `"fail"` it will return apropriate respond. If the function throws an error it will also include it's message by default:

```js
// 500
{
  status: 'fail',
  output: 'Message of the error', // only included if the health function throws an error
}
```

If the health function returns `warn` it will return a warning:
```js
// 200
{
  status: 'warn',
}
```

## advanced usage
```js
const healthili = require('healthili');

const healthEndpoint = healthili.createEndpoint(myHealthFunc, {
  port: 1234,
  path: '/happy',
  timeout: 5000,
  hideError: true,
  description: 'My cool service.',
  serviceId: '1337r2d2',
  version: 13,
  releaseId: "1.0.1",
};
```

This will result in a server listening on port `1234` with the the health endpoint at path `/happy`. The status will be determined by the `myHealthFunc` function. If the `myHealthFunc` function needs longer then `5000` ms to return the healthcheck will fail. The endpoint will not return errors messages in the output key of the response.

**Example fail response:**
```js
// 500
{
  status: 'fail',
  description: 'My cool service.',
  serviceId: '1337r2d2',
  version: 13,
  releaseId: '1.0.1',
}
```

## API

### .createEndpoint(healthFunction[, options])
* `healthFunction` The function called by healthili on request to determine the status of the service
* `options` Options for the endpoint and additional payload
* Returns: `HealthiliEndpoint`

### healthfunction
Determines the status returned by the health endpoint. `async` fucntions are possible.

Depending on the result healthili decides in what status the service is:
| result of the function | status | http code | incl. error message |
| ---|---|---|---|
| `true` or `'pass'`| `'pass'` | `200` | no |
| `'warn'`| `'warn'` | `200` | no |
| `false` or `'fail'`| `'fail'`| `500` | no |
| `throw Error` or timeout | `'fail'`| `500`| message of error or healthfunction timeout |

Please note that errors are included in the appropriate case by default unless `hideError: true` is given in the options.

### Options
The default options object.
```js
{
  // Endpoint options
  port: 3000, // port for the server to listen on
  path: '/health', // path of the health endpoint
  timeout: null, // timeout in ms after which a fail is returned by the endpoint (with a Timeout error message if not hidden)
  
  // Payload Options
  hideError: false, // set to true if you do not want to return the error message within the `output` key of the response
  description: null, // is a human-friendly description of the service.
  serviceId: null, // is a unique identifier of the service, in the application scope
  version: null, // public version of the service
  releaseId: null, // additional releaseId of the service
}
```

### HealthiliEndpoint.close()
* Returns: `Promise`
  
In case you need to close the server `.close()` can be called on the HealthiliEndpoint. It uses `server.close()` in the background. This will stop the server from accepting new connections, but not close open connections. In case there are open connections, it will wait for them to close.

## Todo
* optional [`checks` object](https://tools.ietf.org/html/draft-inadarei-api-health-check-04#section-3.6) is not included in the response, as it would add a lot of complexity.
* optional [`links` key](https://tools.ietf.org/html/draft-inadarei-api-health-check-04#section-3.7) is not included in the response, as it would add a lot of complexity.
* partial health checks?