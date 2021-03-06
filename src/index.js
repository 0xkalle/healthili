const http = require('http');

const timeoutPromise = (ms) => new Promise((resolve, reject) => {
  setTimeout(reject.bind(null, new Error(`Health function timed out after ${ms} ms!`)), ms);
});

/**
 * Create a healthili health endpoint with the given healthFunction and options.
 * @param {function(): Boolean|function(): string} healthFunction (async) function
 * returning true, false, 'pass', 'warn', 'fail' or throws an
 * error to signal the services health to return by the endpoint
 * @param {Object} options additional options to setup the endpoint and it's payload
 * @param {string|number} [options.serviceId] the serviceId of the service
 * @param {string} [options.description] a human-friendly description of the service
 * @param {string|number} [options.version] The version of the service
 * @param {string|number} [options.releaseId] The realeaseId of the service
 * @param {number} [options.port=3000] port where the server will listen default to 3000
 * @param {boolean} [options.hideError=false] should errors returned by
 *  the health function be hidden? default: false
 * @param {number} [options.timeout] timeout after which a fail is returned with
 * a Timeout error message.
 */
const createEndpoint = (healthFunction, {
  serviceId,
  description,
  version,
  releaseId,
  port = 3000,
  hideError = false,
  path = '/health',
  timeout,
} = {}) => {
  // creating the check function to include the timeout if needed
  const checkFunction = async () => {
    if (timeout) return Promise.race([healthFunction(), timeoutPromise(timeout)]);
    return healthFunction();
  };

  // prevent missing leading / in path
  const serverPath = path.startsWith('/') ? path : `/${path}`;

  // creating the http server
  const server = http.createServer(async (req, res) => {
    // If request has the wrong path return 404
    if (req.url !== serverPath) {
      res.writeHead(404);
      res.end();
    }

    let healthResult = null;
    let error = null;

    // get the status from the check function and catch an error
    try {
      healthResult = await checkFunction();
    } catch (e) {
      error = e;
    }

    // determine the needed http status code and status,
    // starting with fail and set to pass or warn is approptiate
    let statusCode = 500;
    let status = 'fail';
    if (!error && (healthResult === true || healthResult === 'pass')) {
      status = 'pass';
      statusCode = 200;
    } else if (!error && healthResult === 'warn') {
      status = 'warn';
      statusCode = 200;
    }

    // set the http status code and a header for the content type
    res.writeHead(statusCode, {
      'Content-Type': 'application/health+json',
    });

    // set up the payload with at leat the status key + additional keys from options.
    const payload = {
      status,
      ...serviceId && { serviceId },
      ...version && { version },
      ...releaseId && { releaseId },
      ...description && { description },
      ...error && !hideError && { output: error.message }, // only added if hideError = false
    };
    // sned the response
    res.end(JSON.stringify(payload), 'utf8');
  });

  // starting the server on the given port
  server.listen(port);

  // returning an object with the close function to shut the server down
  return {
    close() {
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          resolve(true);
        });
      });
    },
  };
};

module.exports = {
  createEndpoint,
};
