(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.WordleSolverModule = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
module.exports = require('./lib/axios');
},{"./lib/axios":4}],3:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var settle = require('./../core/settle');
var cookies = require('./../helpers/cookies');
var buildURL = require('./../helpers/buildURL');
var buildFullPath = require('../core/buildFullPath');
var parseHeaders = require('./../helpers/parseHeaders');
var isURLSameOrigin = require('./../helpers/isURLSameOrigin');
var createError = require('../core/createError');
var defaults = require('../defaults');
var Cancel = require('../cancel/Cancel');

module.exports = function xhrAdapter(config) {
  return new Promise(function dispatchXhrRequest(resolve, reject) {
    var requestData = config.data;
    var requestHeaders = config.headers;
    var responseType = config.responseType;
    var onCanceled;
    function done() {
      if (config.cancelToken) {
        config.cancelToken.unsubscribe(onCanceled);
      }

      if (config.signal) {
        config.signal.removeEventListener('abort', onCanceled);
      }
    }

    if (utils.isFormData(requestData)) {
      delete requestHeaders['Content-Type']; // Let the browser set it
    }

    var request = new XMLHttpRequest();

    // HTTP basic authentication
    if (config.auth) {
      var username = config.auth.username || '';
      var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
    }

    var fullPath = buildFullPath(config.baseURL, config.url);
    request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

    // Set the request timeout in MS
    request.timeout = config.timeout;

    function onloadend() {
      if (!request) {
        return;
      }
      // Prepare the response
      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
      var responseData = !responseType || responseType === 'text' ||  responseType === 'json' ?
        request.responseText : request.response;
      var response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config,
        request: request
      };

      settle(function _resolve(value) {
        resolve(value);
        done();
      }, function _reject(err) {
        reject(err);
        done();
      }, response);

      // Clean up request
      request = null;
    }

    if ('onloadend' in request) {
      // Use onloadend if available
      request.onloadend = onloadend;
    } else {
      // Listen for ready state to emulate onloadend
      request.onreadystatechange = function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }

        // The request errored out and we didn't get a response, this will be
        // handled by onerror instead
        // With one exception: request that using file: protocol, most browsers
        // will return status as 0 even though it's a successful request
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
          return;
        }
        // readystate handler is calling before onerror or ontimeout handlers,
        // so we should call onloadend on the next 'tick'
        setTimeout(onloadend);
      };
    }

    // Handle browser request cancellation (as opposed to a manual cancellation)
    request.onabort = function handleAbort() {
      if (!request) {
        return;
      }

      reject(createError('Request aborted', config, 'ECONNABORTED', request));

      // Clean up request
      request = null;
    };

    // Handle low level network errors
    request.onerror = function handleError() {
      // Real errors are hidden from us by the browser
      // onerror should only fire if it's a network error
      reject(createError('Network Error', config, null, request));

      // Clean up request
      request = null;
    };

    // Handle timeout
    request.ontimeout = function handleTimeout() {
      var timeoutErrorMessage = config.timeout ? 'timeout of ' + config.timeout + 'ms exceeded' : 'timeout exceeded';
      var transitional = config.transitional || defaults.transitional;
      if (config.timeoutErrorMessage) {
        timeoutErrorMessage = config.timeoutErrorMessage;
      }
      reject(createError(
        timeoutErrorMessage,
        config,
        transitional.clarifyTimeoutError ? 'ETIMEDOUT' : 'ECONNABORTED',
        request));

      // Clean up request
      request = null;
    };

    // Add xsrf header
    // This is only done if running in a standard browser environment.
    // Specifically not if we're in a web worker, or react-native.
    if (utils.isStandardBrowserEnv()) {
      // Add xsrf header
      var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
        cookies.read(config.xsrfCookieName) :
        undefined;

      if (xsrfValue) {
        requestHeaders[config.xsrfHeaderName] = xsrfValue;
      }
    }

    // Add headers to the request
    if ('setRequestHeader' in request) {
      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
          // Remove Content-Type if data is undefined
          delete requestHeaders[key];
        } else {
          // Otherwise add header to the request
          request.setRequestHeader(key, val);
        }
      });
    }

    // Add withCredentials to request if needed
    if (!utils.isUndefined(config.withCredentials)) {
      request.withCredentials = !!config.withCredentials;
    }

    // Add responseType to request if needed
    if (responseType && responseType !== 'json') {
      request.responseType = config.responseType;
    }

    // Handle progress if needed
    if (typeof config.onDownloadProgress === 'function') {
      request.addEventListener('progress', config.onDownloadProgress);
    }

    // Not all browsers support upload events
    if (typeof config.onUploadProgress === 'function' && request.upload) {
      request.upload.addEventListener('progress', config.onUploadProgress);
    }

    if (config.cancelToken || config.signal) {
      // Handle cancellation
      // eslint-disable-next-line func-names
      onCanceled = function(cancel) {
        if (!request) {
          return;
        }
        reject(!cancel || (cancel && cancel.type) ? new Cancel('canceled') : cancel);
        request.abort();
        request = null;
      };

      config.cancelToken && config.cancelToken.subscribe(onCanceled);
      if (config.signal) {
        config.signal.aborted ? onCanceled() : config.signal.addEventListener('abort', onCanceled);
      }
    }

    if (!requestData) {
      requestData = null;
    }

    // Send the request
    request.send(requestData);
  });
};

},{"../cancel/Cancel":5,"../core/buildFullPath":10,"../core/createError":11,"../defaults":17,"./../core/settle":15,"./../helpers/buildURL":20,"./../helpers/cookies":22,"./../helpers/isURLSameOrigin":25,"./../helpers/parseHeaders":27,"./../utils":30}],4:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var bind = require('./helpers/bind');
var Axios = require('./core/Axios');
var mergeConfig = require('./core/mergeConfig');
var defaults = require('./defaults');

/**
 * Create an instance of Axios
 *
 * @param {Object} defaultConfig The default config for the instance
 * @return {Axios} A new instance of Axios
 */
function createInstance(defaultConfig) {
  var context = new Axios(defaultConfig);
  var instance = bind(Axios.prototype.request, context);

  // Copy axios.prototype to instance
  utils.extend(instance, Axios.prototype, context);

  // Copy context to instance
  utils.extend(instance, context);

  // Factory for creating new instances
  instance.create = function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  };

  return instance;
}

// Create the default instance to be exported
var axios = createInstance(defaults);

// Expose Axios class to allow class inheritance
axios.Axios = Axios;

// Expose Cancel & CancelToken
axios.Cancel = require('./cancel/Cancel');
axios.CancelToken = require('./cancel/CancelToken');
axios.isCancel = require('./cancel/isCancel');
axios.VERSION = require('./env/data').version;

// Expose all/spread
axios.all = function all(promises) {
  return Promise.all(promises);
};
axios.spread = require('./helpers/spread');

// Expose isAxiosError
axios.isAxiosError = require('./helpers/isAxiosError');

module.exports = axios;

// Allow use of default import syntax in TypeScript
module.exports.default = axios;

},{"./cancel/Cancel":5,"./cancel/CancelToken":6,"./cancel/isCancel":7,"./core/Axios":8,"./core/mergeConfig":14,"./defaults":17,"./env/data":18,"./helpers/bind":19,"./helpers/isAxiosError":24,"./helpers/spread":28,"./utils":30}],5:[function(require,module,exports){
'use strict';

/**
 * A `Cancel` is an object that is thrown when an operation is canceled.
 *
 * @class
 * @param {string=} message The message.
 */
function Cancel(message) {
  this.message = message;
}

Cancel.prototype.toString = function toString() {
  return 'Cancel' + (this.message ? ': ' + this.message : '');
};

Cancel.prototype.__CANCEL__ = true;

module.exports = Cancel;

},{}],6:[function(require,module,exports){
'use strict';

var Cancel = require('./Cancel');

/**
 * A `CancelToken` is an object that can be used to request cancellation of an operation.
 *
 * @class
 * @param {Function} executor The executor function.
 */
function CancelToken(executor) {
  if (typeof executor !== 'function') {
    throw new TypeError('executor must be a function.');
  }

  var resolvePromise;

  this.promise = new Promise(function promiseExecutor(resolve) {
    resolvePromise = resolve;
  });

  var token = this;

  // eslint-disable-next-line func-names
  this.promise.then(function(cancel) {
    if (!token._listeners) return;

    var i;
    var l = token._listeners.length;

    for (i = 0; i < l; i++) {
      token._listeners[i](cancel);
    }
    token._listeners = null;
  });

  // eslint-disable-next-line func-names
  this.promise.then = function(onfulfilled) {
    var _resolve;
    // eslint-disable-next-line func-names
    var promise = new Promise(function(resolve) {
      token.subscribe(resolve);
      _resolve = resolve;
    }).then(onfulfilled);

    promise.cancel = function reject() {
      token.unsubscribe(_resolve);
    };

    return promise;
  };

  executor(function cancel(message) {
    if (token.reason) {
      // Cancellation has already been requested
      return;
    }

    token.reason = new Cancel(message);
    resolvePromise(token.reason);
  });
}

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
CancelToken.prototype.throwIfRequested = function throwIfRequested() {
  if (this.reason) {
    throw this.reason;
  }
};

/**
 * Subscribe to the cancel signal
 */

CancelToken.prototype.subscribe = function subscribe(listener) {
  if (this.reason) {
    listener(this.reason);
    return;
  }

  if (this._listeners) {
    this._listeners.push(listener);
  } else {
    this._listeners = [listener];
  }
};

/**
 * Unsubscribe from the cancel signal
 */

CancelToken.prototype.unsubscribe = function unsubscribe(listener) {
  if (!this._listeners) {
    return;
  }
  var index = this._listeners.indexOf(listener);
  if (index !== -1) {
    this._listeners.splice(index, 1);
  }
};

/**
 * Returns an object that contains a new `CancelToken` and a function that, when called,
 * cancels the `CancelToken`.
 */
CancelToken.source = function source() {
  var cancel;
  var token = new CancelToken(function executor(c) {
    cancel = c;
  });
  return {
    token: token,
    cancel: cancel
  };
};

module.exports = CancelToken;

},{"./Cancel":5}],7:[function(require,module,exports){
'use strict';

module.exports = function isCancel(value) {
  return !!(value && value.__CANCEL__);
};

},{}],8:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var buildURL = require('../helpers/buildURL');
var InterceptorManager = require('./InterceptorManager');
var dispatchRequest = require('./dispatchRequest');
var mergeConfig = require('./mergeConfig');
var validator = require('../helpers/validator');

var validators = validator.validators;
/**
 * Create a new instance of Axios
 *
 * @param {Object} instanceConfig The default config for the instance
 */
function Axios(instanceConfig) {
  this.defaults = instanceConfig;
  this.interceptors = {
    request: new InterceptorManager(),
    response: new InterceptorManager()
  };
}

/**
 * Dispatch a request
 *
 * @param {Object} config The config specific for this request (merged with this.defaults)
 */
Axios.prototype.request = function request(configOrUrl, config) {
  /*eslint no-param-reassign:0*/
  // Allow for axios('example/url'[, config]) a la fetch API
  if (typeof configOrUrl === 'string') {
    config = config || {};
    config.url = configOrUrl;
  } else {
    config = configOrUrl || {};
  }

  if (!config.url) {
    throw new Error('Provided config url is not valid');
  }

  config = mergeConfig(this.defaults, config);

  // Set config.method
  if (config.method) {
    config.method = config.method.toLowerCase();
  } else if (this.defaults.method) {
    config.method = this.defaults.method.toLowerCase();
  } else {
    config.method = 'get';
  }

  var transitional = config.transitional;

  if (transitional !== undefined) {
    validator.assertOptions(transitional, {
      silentJSONParsing: validators.transitional(validators.boolean),
      forcedJSONParsing: validators.transitional(validators.boolean),
      clarifyTimeoutError: validators.transitional(validators.boolean)
    }, false);
  }

  // filter out skipped interceptors
  var requestInterceptorChain = [];
  var synchronousRequestInterceptors = true;
  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
    if (typeof interceptor.runWhen === 'function' && interceptor.runWhen(config) === false) {
      return;
    }

    synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;

    requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
  });

  var responseInterceptorChain = [];
  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
    responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
  });

  var promise;

  if (!synchronousRequestInterceptors) {
    var chain = [dispatchRequest, undefined];

    Array.prototype.unshift.apply(chain, requestInterceptorChain);
    chain = chain.concat(responseInterceptorChain);

    promise = Promise.resolve(config);
    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift());
    }

    return promise;
  }


  var newConfig = config;
  while (requestInterceptorChain.length) {
    var onFulfilled = requestInterceptorChain.shift();
    var onRejected = requestInterceptorChain.shift();
    try {
      newConfig = onFulfilled(newConfig);
    } catch (error) {
      onRejected(error);
      break;
    }
  }

  try {
    promise = dispatchRequest(newConfig);
  } catch (error) {
    return Promise.reject(error);
  }

  while (responseInterceptorChain.length) {
    promise = promise.then(responseInterceptorChain.shift(), responseInterceptorChain.shift());
  }

  return promise;
};

Axios.prototype.getUri = function getUri(config) {
  if (!config.url) {
    throw new Error('Provided config url is not valid');
  }
  config = mergeConfig(this.defaults, config);
  return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
};

// Provide aliases for supported request methods
utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: (config || {}).data
    }));
  };
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  /*eslint func-names:0*/
  Axios.prototype[method] = function(url, data, config) {
    return this.request(mergeConfig(config || {}, {
      method: method,
      url: url,
      data: data
    }));
  };
});

module.exports = Axios;

},{"../helpers/buildURL":20,"../helpers/validator":29,"./../utils":30,"./InterceptorManager":9,"./dispatchRequest":12,"./mergeConfig":14}],9:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function InterceptorManager() {
  this.handlers = [];
}

/**
 * Add a new interceptor to the stack
 *
 * @param {Function} fulfilled The function to handle `then` for a `Promise`
 * @param {Function} rejected The function to handle `reject` for a `Promise`
 *
 * @return {Number} An ID used to remove interceptor later
 */
InterceptorManager.prototype.use = function use(fulfilled, rejected, options) {
  this.handlers.push({
    fulfilled: fulfilled,
    rejected: rejected,
    synchronous: options ? options.synchronous : false,
    runWhen: options ? options.runWhen : null
  });
  return this.handlers.length - 1;
};

/**
 * Remove an interceptor from the stack
 *
 * @param {Number} id The ID that was returned by `use`
 */
InterceptorManager.prototype.eject = function eject(id) {
  if (this.handlers[id]) {
    this.handlers[id] = null;
  }
};

/**
 * Iterate over all the registered interceptors
 *
 * This method is particularly useful for skipping over any
 * interceptors that may have become `null` calling `eject`.
 *
 * @param {Function} fn The function to call for each interceptor
 */
InterceptorManager.prototype.forEach = function forEach(fn) {
  utils.forEach(this.handlers, function forEachHandler(h) {
    if (h !== null) {
      fn(h);
    }
  });
};

module.exports = InterceptorManager;

},{"./../utils":30}],10:[function(require,module,exports){
'use strict';

var isAbsoluteURL = require('../helpers/isAbsoluteURL');
var combineURLs = require('../helpers/combineURLs');

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 * @returns {string} The combined full path
 */
module.exports = function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
};

},{"../helpers/combineURLs":21,"../helpers/isAbsoluteURL":23}],11:[function(require,module,exports){
'use strict';

var enhanceError = require('./enhanceError');

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The created error.
 */
module.exports = function createError(message, config, code, request, response) {
  var error = new Error(message);
  return enhanceError(error, config, code, request, response);
};

},{"./enhanceError":13}],12:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var transformData = require('./transformData');
var isCancel = require('../cancel/isCancel');
var defaults = require('../defaults');
var Cancel = require('../cancel/Cancel');

/**
 * Throws a `Cancel` if cancellation has been requested.
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new Cancel('canceled');
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 * @returns {Promise} The Promise to be fulfilled
 */
module.exports = function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  // Ensure headers exist
  config.headers = config.headers || {};

  // Transform request data
  config.data = transformData.call(
    config,
    config.data,
    config.headers,
    config.transformRequest
  );

  // Flatten headers
  config.headers = utils.merge(
    config.headers.common || {},
    config.headers[config.method] || {},
    config.headers
  );

  utils.forEach(
    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
    function cleanHeaderConfig(method) {
      delete config.headers[method];
    }
  );

  var adapter = config.adapter || defaults.adapter;

  return adapter(config).then(function onAdapterResolution(response) {
    throwIfCancellationRequested(config);

    // Transform response data
    response.data = transformData.call(
      config,
      response.data,
      response.headers,
      config.transformResponse
    );

    return response;
  }, function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config);

      // Transform response data
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config,
          reason.response.data,
          reason.response.headers,
          config.transformResponse
        );
      }
    }

    return Promise.reject(reason);
  });
};

},{"../cancel/Cancel":5,"../cancel/isCancel":7,"../defaults":17,"./../utils":30,"./transformData":16}],13:[function(require,module,exports){
'use strict';

/**
 * Update an Error with the specified config, error code, and response.
 *
 * @param {Error} error The error to update.
 * @param {Object} config The config.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 * @returns {Error} The error.
 */
module.exports = function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  }

  error.request = request;
  error.response = response;
  error.isAxiosError = true;

  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  };
  return error;
};

},{}],14:[function(require,module,exports){
'use strict';

var utils = require('../utils');

/**
 * Config-specific merge-function which creates a new config-object
 * by merging two configuration objects together.
 *
 * @param {Object} config1
 * @param {Object} config2
 * @returns {Object} New object resulting from merging config2 to config1
 */
module.exports = function mergeConfig(config1, config2) {
  // eslint-disable-next-line no-param-reassign
  config2 = config2 || {};
  var config = {};

  function getMergedValue(target, source) {
    if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
      return utils.merge(target, source);
    } else if (utils.isPlainObject(source)) {
      return utils.merge({}, source);
    } else if (utils.isArray(source)) {
      return source.slice();
    }
    return source;
  }

  // eslint-disable-next-line consistent-return
  function mergeDeepProperties(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function valueFromConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function defaultToConfig2(prop) {
    if (!utils.isUndefined(config2[prop])) {
      return getMergedValue(undefined, config2[prop]);
    } else if (!utils.isUndefined(config1[prop])) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  // eslint-disable-next-line consistent-return
  function mergeDirectKeys(prop) {
    if (prop in config2) {
      return getMergedValue(config1[prop], config2[prop]);
    } else if (prop in config1) {
      return getMergedValue(undefined, config1[prop]);
    }
  }

  var mergeMap = {
    'url': valueFromConfig2,
    'method': valueFromConfig2,
    'data': valueFromConfig2,
    'baseURL': defaultToConfig2,
    'transformRequest': defaultToConfig2,
    'transformResponse': defaultToConfig2,
    'paramsSerializer': defaultToConfig2,
    'timeout': defaultToConfig2,
    'timeoutMessage': defaultToConfig2,
    'withCredentials': defaultToConfig2,
    'adapter': defaultToConfig2,
    'responseType': defaultToConfig2,
    'xsrfCookieName': defaultToConfig2,
    'xsrfHeaderName': defaultToConfig2,
    'onUploadProgress': defaultToConfig2,
    'onDownloadProgress': defaultToConfig2,
    'decompress': defaultToConfig2,
    'maxContentLength': defaultToConfig2,
    'maxBodyLength': defaultToConfig2,
    'transport': defaultToConfig2,
    'httpAgent': defaultToConfig2,
    'httpsAgent': defaultToConfig2,
    'cancelToken': defaultToConfig2,
    'socketPath': defaultToConfig2,
    'responseEncoding': defaultToConfig2,
    'validateStatus': mergeDirectKeys
  };

  utils.forEach(Object.keys(config1).concat(Object.keys(config2)), function computeConfigValue(prop) {
    var merge = mergeMap[prop] || mergeDeepProperties;
    var configValue = merge(prop);
    (utils.isUndefined(configValue) && merge !== mergeDirectKeys) || (config[prop] = configValue);
  });

  return config;
};

},{"../utils":30}],15:[function(require,module,exports){
'use strict';

var createError = require('./createError');

/**
 * Resolve or reject a Promise based on response status.
 *
 * @param {Function} resolve A function that resolves the promise.
 * @param {Function} reject A function that rejects the promise.
 * @param {object} response The response.
 */
module.exports = function settle(resolve, reject, response) {
  var validateStatus = response.config.validateStatus;
  if (!response.status || !validateStatus || validateStatus(response.status)) {
    resolve(response);
  } else {
    reject(createError(
      'Request failed with status code ' + response.status,
      response.config,
      null,
      response.request,
      response
    ));
  }
};

},{"./createError":11}],16:[function(require,module,exports){
'use strict';

var utils = require('./../utils');
var defaults = require('./../defaults');

/**
 * Transform the data for a request or a response
 *
 * @param {Object|String} data The data to be transformed
 * @param {Array} headers The headers for the request or response
 * @param {Array|Function} fns A single function or Array of functions
 * @returns {*} The resulting transformed data
 */
module.exports = function transformData(data, headers, fns) {
  var context = this || defaults;
  /*eslint no-param-reassign:0*/
  utils.forEach(fns, function transform(fn) {
    data = fn.call(context, data, headers);
  });

  return data;
};

},{"./../defaults":17,"./../utils":30}],17:[function(require,module,exports){
(function (process){(function (){
'use strict';

var utils = require('./utils');
var normalizeHeaderName = require('./helpers/normalizeHeaderName');
var enhanceError = require('./core/enhanceError');

var DEFAULT_CONTENT_TYPE = {
  'Content-Type': 'application/x-www-form-urlencoded'
};

function setContentTypeIfUnset(headers, value) {
  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
    headers['Content-Type'] = value;
  }
}

function getDefaultAdapter() {
  var adapter;
  if (typeof XMLHttpRequest !== 'undefined') {
    // For browsers use XHR adapter
    adapter = require('./adapters/xhr');
  } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
    // For node use HTTP adapter
    adapter = require('./adapters/http');
  }
  return adapter;
}

function stringifySafely(rawValue, parser, encoder) {
  if (utils.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils.trim(rawValue);
    } catch (e) {
      if (e.name !== 'SyntaxError') {
        throw e;
      }
    }
  }

  return (encoder || JSON.stringify)(rawValue);
}

var defaults = {

  transitional: {
    silentJSONParsing: true,
    forcedJSONParsing: true,
    clarifyTimeoutError: false
  },

  adapter: getDefaultAdapter(),

  transformRequest: [function transformRequest(data, headers) {
    normalizeHeaderName(headers, 'Accept');
    normalizeHeaderName(headers, 'Content-Type');

    if (utils.isFormData(data) ||
      utils.isArrayBuffer(data) ||
      utils.isBuffer(data) ||
      utils.isStream(data) ||
      utils.isFile(data) ||
      utils.isBlob(data)
    ) {
      return data;
    }
    if (utils.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils.isURLSearchParams(data)) {
      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
      return data.toString();
    }
    if (utils.isObject(data) || (headers && headers['Content-Type'] === 'application/json')) {
      setContentTypeIfUnset(headers, 'application/json');
      return stringifySafely(data);
    }
    return data;
  }],

  transformResponse: [function transformResponse(data) {
    var transitional = this.transitional || defaults.transitional;
    var silentJSONParsing = transitional && transitional.silentJSONParsing;
    var forcedJSONParsing = transitional && transitional.forcedJSONParsing;
    var strictJSONParsing = !silentJSONParsing && this.responseType === 'json';

    if (strictJSONParsing || (forcedJSONParsing && utils.isString(data) && data.length)) {
      try {
        return JSON.parse(data);
      } catch (e) {
        if (strictJSONParsing) {
          if (e.name === 'SyntaxError') {
            throw enhanceError(e, this, 'E_JSON_PARSE');
          }
          throw e;
        }
      }
    }

    return data;
  }],

  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,

  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',

  maxContentLength: -1,
  maxBodyLength: -1,

  validateStatus: function validateStatus(status) {
    return status >= 200 && status < 300;
  },

  headers: {
    common: {
      'Accept': 'application/json, text/plain, */*'
    }
  }
};

utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
  defaults.headers[method] = {};
});

utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
});

module.exports = defaults;

}).call(this)}).call(this,require('_process'))
},{"./adapters/http":3,"./adapters/xhr":3,"./core/enhanceError":13,"./helpers/normalizeHeaderName":26,"./utils":30,"_process":1}],18:[function(require,module,exports){
module.exports = {
  "version": "0.25.0"
};
},{}],19:[function(require,module,exports){
'use strict';

module.exports = function bind(fn, thisArg) {
  return function wrap() {
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }
    return fn.apply(thisArg, args);
  };
};

},{}],20:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

function encode(val) {
  return encodeURIComponent(val).
    replace(/%3A/gi, ':').
    replace(/%24/g, '$').
    replace(/%2C/gi, ',').
    replace(/%20/g, '+').
    replace(/%5B/gi, '[').
    replace(/%5D/gi, ']');
}

/**
 * Build a URL by appending params to the end
 *
 * @param {string} url The base of the url (e.g., http://www.google.com)
 * @param {object} [params] The params to be appended
 * @returns {string} The formatted url
 */
module.exports = function buildURL(url, params, paramsSerializer) {
  /*eslint no-param-reassign:0*/
  if (!params) {
    return url;
  }

  var serializedParams;
  if (paramsSerializer) {
    serializedParams = paramsSerializer(params);
  } else if (utils.isURLSearchParams(params)) {
    serializedParams = params.toString();
  } else {
    var parts = [];

    utils.forEach(params, function serialize(val, key) {
      if (val === null || typeof val === 'undefined') {
        return;
      }

      if (utils.isArray(val)) {
        key = key + '[]';
      } else {
        val = [val];
      }

      utils.forEach(val, function parseValue(v) {
        if (utils.isDate(v)) {
          v = v.toISOString();
        } else if (utils.isObject(v)) {
          v = JSON.stringify(v);
        }
        parts.push(encode(key) + '=' + encode(v));
      });
    });

    serializedParams = parts.join('&');
  }

  if (serializedParams) {
    var hashmarkIndex = url.indexOf('#');
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }

    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
  }

  return url;
};

},{"./../utils":30}],21:[function(require,module,exports){
'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 * @returns {string} The combined URL
 */
module.exports = function combineURLs(baseURL, relativeURL) {
  return relativeURL
    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
};

},{}],22:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs support document.cookie
    (function standardBrowserEnv() {
      return {
        write: function write(name, value, expires, path, domain, secure) {
          var cookie = [];
          cookie.push(name + '=' + encodeURIComponent(value));

          if (utils.isNumber(expires)) {
            cookie.push('expires=' + new Date(expires).toGMTString());
          }

          if (utils.isString(path)) {
            cookie.push('path=' + path);
          }

          if (utils.isString(domain)) {
            cookie.push('domain=' + domain);
          }

          if (secure === true) {
            cookie.push('secure');
          }

          document.cookie = cookie.join('; ');
        },

        read: function read(name) {
          var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
          return (match ? decodeURIComponent(match[3]) : null);
        },

        remove: function remove(name) {
          this.write(name, '', Date.now() - 86400000);
        }
      };
    })() :

  // Non standard browser env (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return {
        write: function write() {},
        read: function read() { return null; },
        remove: function remove() {}
      };
    })()
);

},{"./../utils":30}],23:[function(require,module,exports){
'use strict';

/**
 * Determines whether the specified URL is absolute
 *
 * @param {string} url The URL to test
 * @returns {boolean} True if the specified URL is absolute, otherwise false
 */
module.exports = function isAbsoluteURL(url) {
  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
  // by any combination of letters, digits, plus, period, or hyphen.
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
};

},{}],24:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

/**
 * Determines whether the payload is an error thrown by Axios
 *
 * @param {*} payload The value to test
 * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
 */
module.exports = function isAxiosError(payload) {
  return utils.isObject(payload) && (payload.isAxiosError === true);
};

},{"./../utils":30}],25:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

module.exports = (
  utils.isStandardBrowserEnv() ?

  // Standard browser envs have full support of the APIs needed to test
  // whether the request URL is of the same origin as current location.
    (function standardBrowserEnv() {
      var msie = /(msie|trident)/i.test(navigator.userAgent);
      var urlParsingNode = document.createElement('a');
      var originURL;

      /**
    * Parse a URL to discover it's components
    *
    * @param {String} url The URL to be parsed
    * @returns {Object}
    */
      function resolveURL(url) {
        var href = url;

        if (msie) {
        // IE needs attribute set twice to normalize properties
          urlParsingNode.setAttribute('href', href);
          href = urlParsingNode.href;
        }

        urlParsingNode.setAttribute('href', href);

        // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
        return {
          href: urlParsingNode.href,
          protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
          host: urlParsingNode.host,
          search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
          hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
          hostname: urlParsingNode.hostname,
          port: urlParsingNode.port,
          pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
            urlParsingNode.pathname :
            '/' + urlParsingNode.pathname
        };
      }

      originURL = resolveURL(window.location.href);

      /**
    * Determine if a URL shares the same origin as the current location
    *
    * @param {String} requestURL The URL to test
    * @returns {boolean} True if URL shares the same origin, otherwise false
    */
      return function isURLSameOrigin(requestURL) {
        var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
        return (parsed.protocol === originURL.protocol &&
            parsed.host === originURL.host);
      };
    })() :

  // Non standard browser envs (web workers, react-native) lack needed support.
    (function nonStandardBrowserEnv() {
      return function isURLSameOrigin() {
        return true;
      };
    })()
);

},{"./../utils":30}],26:[function(require,module,exports){
'use strict';

var utils = require('../utils');

module.exports = function normalizeHeaderName(headers, normalizedName) {
  utils.forEach(headers, function processHeader(value, name) {
    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
      headers[normalizedName] = value;
      delete headers[name];
    }
  });
};

},{"../utils":30}],27:[function(require,module,exports){
'use strict';

var utils = require('./../utils');

// Headers whose duplicates are ignored by node
// c.f. https://nodejs.org/api/http.html#http_message_headers
var ignoreDuplicateOf = [
  'age', 'authorization', 'content-length', 'content-type', 'etag',
  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
  'referer', 'retry-after', 'user-agent'
];

/**
 * Parse headers into an object
 *
 * ```
 * Date: Wed, 27 Aug 2014 08:58:49 GMT
 * Content-Type: application/json
 * Connection: keep-alive
 * Transfer-Encoding: chunked
 * ```
 *
 * @param {String} headers Headers needing to be parsed
 * @returns {Object} Headers parsed into an object
 */
module.exports = function parseHeaders(headers) {
  var parsed = {};
  var key;
  var val;
  var i;

  if (!headers) { return parsed; }

  utils.forEach(headers.split('\n'), function parser(line) {
    i = line.indexOf(':');
    key = utils.trim(line.substr(0, i)).toLowerCase();
    val = utils.trim(line.substr(i + 1));

    if (key) {
      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
        return;
      }
      if (key === 'set-cookie') {
        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
      } else {
        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
      }
    }
  });

  return parsed;
};

},{"./../utils":30}],28:[function(require,module,exports){
'use strict';

/**
 * Syntactic sugar for invoking a function and expanding an array for arguments.
 *
 * Common use case would be to use `Function.prototype.apply`.
 *
 *  ```js
 *  function f(x, y, z) {}
 *  var args = [1, 2, 3];
 *  f.apply(null, args);
 *  ```
 *
 * With `spread` this example can be re-written.
 *
 *  ```js
 *  spread(function(x, y, z) {})([1, 2, 3]);
 *  ```
 *
 * @param {Function} callback
 * @returns {Function}
 */
module.exports = function spread(callback) {
  return function wrap(arr) {
    return callback.apply(null, arr);
  };
};

},{}],29:[function(require,module,exports){
'use strict';

var VERSION = require('../env/data').version;

var validators = {};

// eslint-disable-next-line func-names
['object', 'boolean', 'number', 'function', 'string', 'symbol'].forEach(function(type, i) {
  validators[type] = function validator(thing) {
    return typeof thing === type || 'a' + (i < 1 ? 'n ' : ' ') + type;
  };
});

var deprecatedWarnings = {};

/**
 * Transitional option validator
 * @param {function|boolean?} validator - set to false if the transitional option has been removed
 * @param {string?} version - deprecated version / removed since version
 * @param {string?} message - some message with additional info
 * @returns {function}
 */
validators.transitional = function transitional(validator, version, message) {
  function formatMessage(opt, desc) {
    return '[Axios v' + VERSION + '] Transitional option \'' + opt + '\'' + desc + (message ? '. ' + message : '');
  }

  // eslint-disable-next-line func-names
  return function(value, opt, opts) {
    if (validator === false) {
      throw new Error(formatMessage(opt, ' has been removed' + (version ? ' in ' + version : '')));
    }

    if (version && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      // eslint-disable-next-line no-console
      console.warn(
        formatMessage(
          opt,
          ' has been deprecated since v' + version + ' and will be removed in the near future'
        )
      );
    }

    return validator ? validator(value, opt, opts) : true;
  };
};

/**
 * Assert object's properties type
 * @param {object} options
 * @param {object} schema
 * @param {boolean?} allowUnknown
 */

function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  var keys = Object.keys(options);
  var i = keys.length;
  while (i-- > 0) {
    var opt = keys[i];
    var validator = schema[opt];
    if (validator) {
      var value = options[opt];
      var result = value === undefined || validator(value, opt, options);
      if (result !== true) {
        throw new TypeError('option ' + opt + ' must be ' + result);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw Error('Unknown option ' + opt);
    }
  }
}

module.exports = {
  assertOptions: assertOptions,
  validators: validators
};

},{"../env/data":18}],30:[function(require,module,exports){
'use strict';

var bind = require('./helpers/bind');

// utils is a library of generic helper functions non-specific to axios

var toString = Object.prototype.toString;

/**
 * Determine if a value is an Array
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Array, otherwise false
 */
function isArray(val) {
  return Array.isArray(val);
}

/**
 * Determine if a value is undefined
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if the value is undefined, otherwise false
 */
function isUndefined(val) {
  return typeof val === 'undefined';
}

/**
 * Determine if a value is a Buffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Buffer, otherwise false
 */
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
}

/**
 * Determine if a value is an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
 */
function isArrayBuffer(val) {
  return toString.call(val) === '[object ArrayBuffer]';
}

/**
 * Determine if a value is a FormData
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an FormData, otherwise false
 */
function isFormData(val) {
  return toString.call(val) === '[object FormData]';
}

/**
 * Determine if a value is a view on an ArrayBuffer
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
 */
function isArrayBufferView(val) {
  var result;
  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
    result = ArrayBuffer.isView(val);
  } else {
    result = (val) && (val.buffer) && (isArrayBuffer(val.buffer));
  }
  return result;
}

/**
 * Determine if a value is a String
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a String, otherwise false
 */
function isString(val) {
  return typeof val === 'string';
}

/**
 * Determine if a value is a Number
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Number, otherwise false
 */
function isNumber(val) {
  return typeof val === 'number';
}

/**
 * Determine if a value is an Object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is an Object, otherwise false
 */
function isObject(val) {
  return val !== null && typeof val === 'object';
}

/**
 * Determine if a value is a plain Object
 *
 * @param {Object} val The value to test
 * @return {boolean} True if value is a plain Object, otherwise false
 */
function isPlainObject(val) {
  if (toString.call(val) !== '[object Object]') {
    return false;
  }

  var prototype = Object.getPrototypeOf(val);
  return prototype === null || prototype === Object.prototype;
}

/**
 * Determine if a value is a Date
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Date, otherwise false
 */
function isDate(val) {
  return toString.call(val) === '[object Date]';
}

/**
 * Determine if a value is a File
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a File, otherwise false
 */
function isFile(val) {
  return toString.call(val) === '[object File]';
}

/**
 * Determine if a value is a Blob
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Blob, otherwise false
 */
function isBlob(val) {
  return toString.call(val) === '[object Blob]';
}

/**
 * Determine if a value is a Function
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Function, otherwise false
 */
function isFunction(val) {
  return toString.call(val) === '[object Function]';
}

/**
 * Determine if a value is a Stream
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a Stream, otherwise false
 */
function isStream(val) {
  return isObject(val) && isFunction(val.pipe);
}

/**
 * Determine if a value is a URLSearchParams object
 *
 * @param {Object} val The value to test
 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
 */
function isURLSearchParams(val) {
  return toString.call(val) === '[object URLSearchParams]';
}

/**
 * Trim excess whitespace off the beginning and end of a string
 *
 * @param {String} str The String to trim
 * @returns {String} The String freed of excess whitespace
 */
function trim(str) {
  return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

/**
 * Determine if we're running in a standard browser environment
 *
 * This allows axios to run in a web worker, and react-native.
 * Both environments support XMLHttpRequest, but not fully standard globals.
 *
 * web workers:
 *  typeof window -> undefined
 *  typeof document -> undefined
 *
 * react-native:
 *  navigator.product -> 'ReactNative'
 * nativescript
 *  navigator.product -> 'NativeScript' or 'NS'
 */
function isStandardBrowserEnv() {
  if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                           navigator.product === 'NativeScript' ||
                                           navigator.product === 'NS')) {
    return false;
  }
  return (
    typeof window !== 'undefined' &&
    typeof document !== 'undefined'
  );
}

/**
 * Iterate over an Array or an Object invoking a function for each item.
 *
 * If `obj` is an Array callback will be called passing
 * the value, index, and complete array for each item.
 *
 * If 'obj' is an Object callback will be called passing
 * the value, key, and complete object for each property.
 *
 * @param {Object|Array} obj The object to iterate
 * @param {Function} fn The callback to invoke for each item
 */
function forEach(obj, fn) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (var i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        fn.call(null, obj[key], key, obj);
      }
    }
  }
}

/**
 * Accepts varargs expecting each argument to be an object, then
 * immutably merges the properties of each object and returns result.
 *
 * When multiple objects contain the same key the later object in
 * the arguments list will take precedence.
 *
 * Example:
 *
 * ```js
 * var result = merge({foo: 123}, {foo: 456});
 * console.log(result.foo); // outputs 456
 * ```
 *
 * @param {Object} obj1 Object to merge
 * @returns {Object} Result of all merge properties
 */
function merge(/* obj1, obj2, obj3, ... */) {
  var result = {};
  function assignValue(val, key) {
    if (isPlainObject(result[key]) && isPlainObject(val)) {
      result[key] = merge(result[key], val);
    } else if (isPlainObject(val)) {
      result[key] = merge({}, val);
    } else if (isArray(val)) {
      result[key] = val.slice();
    } else {
      result[key] = val;
    }
  }

  for (var i = 0, l = arguments.length; i < l; i++) {
    forEach(arguments[i], assignValue);
  }
  return result;
}

/**
 * Extends object a by mutably adding to it the properties of object b.
 *
 * @param {Object} a The object to be extended
 * @param {Object} b The object to copy properties from
 * @param {Object} thisArg The object to bind function to
 * @return {Object} The resulting value of object a
 */
function extend(a, b, thisArg) {
  forEach(b, function assignValue(val, key) {
    if (thisArg && typeof val === 'function') {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  });
  return a;
}

/**
 * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
 *
 * @param {string} content with BOM
 * @return {string} content value without BOM
 */
function stripBOM(content) {
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return content;
}

module.exports = {
  isArray: isArray,
  isArrayBuffer: isArrayBuffer,
  isBuffer: isBuffer,
  isFormData: isFormData,
  isArrayBufferView: isArrayBufferView,
  isString: isString,
  isNumber: isNumber,
  isObject: isObject,
  isPlainObject: isPlainObject,
  isUndefined: isUndefined,
  isDate: isDate,
  isFile: isFile,
  isBlob: isBlob,
  isFunction: isFunction,
  isStream: isStream,
  isURLSearchParams: isURLSearchParams,
  isStandardBrowserEnv: isStandardBrowserEnv,
  forEach: forEach,
  merge: merge,
  extend: extend,
  trim: trim,
  stripBOM: stripBOM
};

},{"./helpers/bind":19}],31:[function(require,module,exports){
var wordlist = require("wordle-wordlist");
var topwords = ["about","other","which","their","there","first","would","these","click","price","state","email","world","music","after","video","where","books","links","years","order","items","group","under","games","could","great","hotel","store","terms","right","local","those","using","phone","forum","based","black","check","index","being","women","today","south","pages","found","house","photo","power","while","three","total","place","think","north","posts","media","water","since","guide","board","white","small","times","sites","level","hours","image","title","shall","class","still","money","every","visit","tools","reply","value","press","learn","print","stock","point","sales","large","table","start","model","human","movie","march","yahoo","going","study","staff","again","april","never","users","topic","below","party","login","legal","above","quote","story","rates","young","field","paper","girls","night","texas","poker","issue","range","court","audio","light","write","offer","given","files","event","china","needs","might","month","major","areas","space","cards","child","enter","share","added","radio","until","color","track","least","trade","david","green","close","drive","short","means","daily","beach","costs","style","front","parts","early","miles","sound","works","rules","final","adult","thing","cheap","third","gifts","cover","often","watch","deals","words","linux","james","heart","error","clear","makes","india","taken","known","cases","quick","whole","later","basic","shows","along","among","death","speed","brand","stuff","japan","doing","loans","shoes","entry","notes","force","river","album","views","plans","build","types","lines","apply","asked","cross","weeks","lower","union","names","leave","teens","woman","cable","score","shown","flash","ideas","allow","homes","super","asian","cause","focus","rooms","voice","comes","brown","forms","glass","happy","smith","thank","prior","sport","ready","round","built","blood","earth","nokia","italy","basis","award","peter","extra","pussy","rated","quite","horse","stars","lists","owner","takes","bring","input","agent","valid","grand","trial","units","wrote","ships","metal","funds","guest","seems","trust","multi","grade","panel","floor","match","plant","sense","stage","goods","maybe","spain","youth","break","dance","apple","enjoy","block","civil","steel","songs","fixed","wrong","hands","paris","fully","worth","peace","coast","grant","agree","blogs","scale","stand","frame","chief","gives","heard","begin","royal","clean","bible","suite","vegas","chris","piece","sheet","seven","older","cells","looks","calls","whose","naked","lives","stone","tests","buyer","steve","label","scott","canon","waste","chair","phase","motor","shirt","crime","count","claim","patch","santa","alone","jones","saint","drugs","joint","fresh","dates","upper","prime","limit","began","louis","steps","shops","creek","urban","tours","labor","admin","heavy","solid","theme","porno","touch","goals","serve","magic","mount","smart","latin","avoid","birth","virus","abuse","facts","faith","chain","moved","reach","sorry","gamma","truth","films","owned","draft","chart","jesus","clubs","equal","codes","kinds","teams","funny","tried","named","laser","harry","taxes","mouse","brain","dream","false","falls","stats","carry","hello","clips","brief","ended","eight","wants","alert","queen","sweet","diego","truck","votes","ocean","signs","depth","train","feeds","route","frank","anime","speak","query","rural","judge","bytes","fight","filed","korea","banks","kelly","leads","brian","miami","wales","minor","noted","spent","davis","helps","cycle","sleep","scene","drink","intel","rings","henry","guess","ahead","devel","delta","cisco","alpha","bonus","adobe","trees","dress","refer","babes","layer","spend","clock","ratio","proof","empty","maine","ideal","specs","parks","cream","boxes","hills","aware","shape","irish","firms","usage","mixed","exist","wheel","angel","width","noise","array","greek","sharp","occur","knows","coach","kevin","plate","logic","sizes","plain","costa","trail","buddy","setup","blues","scope","crazy","bears","mouth","meter","fruit","mysql","lewis","sugar","stick","allen","genre","slide","exact","bound","storm","micro","dolls","paint","delay","pilot","czech","novel","ultra","idaho","plays","truly","lodge","boobs","broad","swiss","sarah","clark","foods","guard","newly","raise","drama","bands","lunch","dildo","audit","polls","tower","yours","jason","shell","solar","catch","doubt","tasks","const","doors","forth","bruce","split","twice","egypt","shift","simon","marks","loved","birds","saved","shots","moore","treat","piano","risks","ports","teach","rapid","hairy","dutch","boots","holds","pulse","metro","strip","pearl","penis","heads","logos","milfs","honda","bills","opera","asset","blank","humor","lived","tight","meant","plane","meets","tampa","grace","susan","adams","villa","inner","roman","taste","trips","sides","turns","cache","lease","proud","giant","seats","alarm","usual","angle","vinyl","worst","honor","eagle","pants","nurse","quiet","comic","crown","maker","crack","picks","smoke","craft","apart","blind","coins","gross","epson","actor","finds","fifth","prize","dirty","wayne","alive","prove","wings","ridge","modem","larry","skill","moves","throw","trend","rhode","busty","worse","boats","tells","fiber","graph","talks","bonds","fraud","roger","crash","inter","grove","spray","roads","faces","cocks","mayor","yield","hence","radar","lakes","diary","kings","flags","baker","shock","walls","ebony","drawn","beast","dodge","pizza","yards","woods","jokes","twiki","globe","dicke","kerry","ghost","pride","keith","linda","chile","maria","brass","plaza","quest","trans","booty","acres","venue","vital","excel","modes","enemy","wells","opens","lucky","thick","iraqi","vista","chips","terry","flood","arena","grown","jerry","smile","lands","armed","laura","tokyo","nikon","candy","pills","tiger","folks","balls","boost","icons","moral","keeps","pound","roses","bread","tough","gonna","chest","billy","craig","solve","nancy","tones","sight","towns","worry","reads","roles","glory","saudi","fault","karen","jimmy","rugby","fluid","barry","devil","grass","marie","kenya","sized","manga","theft","swing","dated","shoot","elite","poems","robot","winds","gnome","roots","noble","shore","loves","loose","slots","rocks","genes","horny","hosts","atlas","feels","ralph","corps","liver","decor","texts","evans","fails","aging","alice","intro","clerk","mills","jeans","fonts","favor","sigma","xhtml","aside","essay","camps","aaron","trace","packs","spoke","arrow","rough","weird","holes","blade","meals","robin","strap","crowd","cloud","valve","knife","shelf","liked","adopt","fotos","outer","tales","islam","nodes","seeds","cited","skype","tired","steam","acute","stood","carol","stack","curve","amber","trunk","waves","camel","lamps","juice","chase","sauce","beads","flows","fewer","proxy","lanka","voted","bikes","gates","slave","lycos","zdnet","combo","haven","charm","basin","ranch","drunk","toner","latex","delhi","alien","broke","nepal","nylon","discs","rocky","fleet","bunch","cents","omega","civic","saver","grill","grain","wanna","seeks","gains","spots","salon","turbo","thats","aimed","reset","brush","spare","kodak","skirt","honey","gauge","faced","sixth","farms","cheat","sandy","macro","laugh","pitch","autos","perry","dozen","teeth","cloth","stamp","lotus","cargo","salem","likes","tapes","zones","races","maple","depot","blend","julie","janet","phpbb","probe","helen","lopez","debug","chuck","ebook","bingo","minds","xanax","sunny","leeds","cedar","blair","hopes","mason","burns","pumps","mario","utils","pairs","chose","blast","tommy","brake","congo","olive","cyber","clone","dicks","relay","tears","oasis","angry","lover","rolls","malta","daddy","ferry","omaha","loads","motel","rally","dying","stuck","stops","vocal","organ","lemon","toxic","bench","rider","butts","bobby","sheep","wines","salad","paste","katie","relax","sword","sells","coral","pixel","float","colin","paths","acids","dairy","admit","fancy","samoa","squad","wages","males","chaos","wheat","bases","unity","bride","begun","socks","essex","fever","drums","rover","flame","tanks","spell","emily","annex","sudan","sluts","hints","wired","elvis","argue","arise","jamie","bitch","chess","oscar","menus","canal","amino","herbs","lying","drill","bryan","hobby","tries","trick","myers","drops","wider","screw","blame","fifty","uncle","jacob","randy","brick","naval","donna","cabin","eddie","fired","perth","syria","klein","tires","retro","anger","suits","glenn","handy","crops","guild","tribe","batch","alter","ghana","edges","twins","amend","chick","thong","medal","walks","sucks","booth","indie","bones","breed","polar","msgid","carey","danny","patio","lloyd","beans","ellis","snake","julia","berry","ought","fixes","sends","mazda","timer","tyler","verse","highs","ellen","racks","nasty","tumor","watts","forty","tubes","floyd","queue","skins","exams","welsh","belly","haiti","elder","sonic","thumb","twist","ranks","debut","volvo","penny","ivory","remix","alias","newer","spice","ascii","donor","trash","manor","diane","disco","endif","minus","milan","shade","digit","lions","pools","lyric","grave","howto","devon","saves","lobby","punch","gotta","karma","betty","lucas","mardi","shake","holly","silly","mercy","fence","diana","shame","fatal","flesh","jesse","qatar","sheer","witch","cohen","puppy","kathy","smell","satin","promo","tunes","lucia","nerve","renew","locks","euros","rebel","hired","hindu","kills","slope","nails","whats","rides","rehab","merit","disks","condo","fairy","shaft","casio","kitty","drain","monte","fires","panic","leone","onion","beats","merry","scuba","verde","dried","derby","annie","derek","steal","fears","tuner","alike","sagem","scout","dealt","bucks","badge","wrist","heath","lexus","realm","jenny","yemen","buses","rouge","yeast","kenny","yukon","singh","brook","wives","xerox","sorts","vsnet","papua","armor","viral","pipes","laden","aruba","merge","edgar","dubai","allan","sperm","filme","craps","frost","sally","yacht","tracy","whale","shark","grows","cliff","tract","shine","wendy","diffs","ozone","pasta","serum","swift","inbox","focal","samba","wound","belle","cindy","lined","boxed","cubic","spies","elect","bunny","chevy","tions","flyer","baths","emacs","climb","sparc","dover","token","kinda","dylan","belts","burke","clara","flush","hayes","moses","johns","jewel","teddy","dryer","ruled","funky","joins","scary","mpegs","cakes","mixer","sbjct","tooth","stays","drove","upset","mines","logan","lance","colon","lanes","purse","align","bless","crest","alloy","plots","tulsa","casey","draws","bloom","loops","surge","tahoe","souls","spank","vault","wires","mails","blake","orbit","niger","bacon","paxil","spine","trout","apnic","fatty","joyce","marco","isaac","oxide","badly","scoop","sanyo","blink","carlo","tiles","tamil","fuzzy","grams","forge","dense","brave","awful","meyer","whore","wagon","knock","peers","quilt","notre","mambo","flour","choir","blond","burst","wiley","fibre","daisy","crude","bored","allah","fares","hoped","safer","marsh","ricky","theta","stake","arbor","rifle","bulbs","waist","sewer","bosch","vitro","hyatt","romeo","turks","demos","sided","cuban","resin","linen","seals","decay","usher","skate","lynch","franc","timor","flats","heels","voter","urine","capri","towel","sears","flies","crane","popup","habit","coupe","benin","lords","tends","sixty","spark","spike","tonga","backs","soils","hunks","libya","sedan","cares","flora","kazaa","hardy","bells","denim","andre","buick","doses","baked","glove","alito","plush","weber","nelly","urged","brent","kyoto","adapt","fuels","brett","paula","stern","shawn","tutor","idiot","debit","edits","raven","slice","aspen","lemma","venus","dolby","nikki","halls","pause","demon","gabon","atari","asses","couch","downs","rogue","sdram","optic","chili","grief","sweat","masks","celeb","assoc","quake","alley","twain","boise","nevis","buffy","loyal","renal","spite","imply","chill","liner","lifts","vivid","acted","byron","skull","riley","ninja","sands","steak","cobra","gucci","threw","https","walsh","ninth","marry","wills","atoms","drake","della","rails","pgsql","fried","cairo","malls","woody","cried","plugs","coded","supra","molly","franz","palau","rival","beige","rolex","homer","gases","genus","dixon","debts","icann","avril","myths","knees","poets","woven","pedro","trent","rigid","salsa","blown","baton","abbey","bruno","evite","diets","sauna","bauer","bowls","qaeda","kitts","macau","cruel","eager","chang","pupil","feast","acura","fedex","ankle","decks","blunt","hamas","react","rises","shane","coats","aston","fairs","flute","hindi","harsh","whois","burma","cease","poles","sioux","jenna","fargo","equip","reged","hedge","curry","worms","dewey","pouch","hooks","peaks","didnt","spoon","bombs","niche","cigar","curse","forex","titan","anita","shout","nudes","straw","fgets","reuse","loses","suede","peach","uncut","stove","nixon","brady","zhang","freak","bluff","sadly","avail","hatch","stein","spill","drift","winxp","crisp","scans","onset","assay","leigh","tents","snack","pulls","squid","maxim","slate","pagan","widow","skies","kicks","canoe","juicy","moody","pedal","tuned","mayer","geoff","scrap","bella","terra","vapor","aloud","goose","winnt","hydro","playa","noisy","abide","socio","bliss","parse","jelly","mania","edwin","clare","bolts","typed","satan","megan","cheer","marty","xlibs","clamp","grape","deeds","traps","racer","guilt","sweep","doyle","ducks","vince","param","lunar","posed","forks","boxer","weigh","rodeo","moose","crush","cathy","paulo","lever","tasty","rants","tarot","carts","cocoa","mixes","panty","aires","bulls","orion","hurry","clash","biker","nauru","stain","reign","baron","bates","stiff","rabbi","sushi","puffy","elbow","stark","circa","quinn","razor","cough","tibet","isles","ovens","inlet","bronx","gloss","panda","porch","isuzu","eaten","sinks","steep","dinar","creed","carat","nobel","faxes","plump","midst","borne","tesco","tempo","getty","payne","torch","lohan","hacks","attic","piper","stems","avery","toons","tenth","desks","aided","cutie","notch","seoul","lacks","bowie","poses","scent","akron","fines","grasp","ounce","buena","toast","kumar","kinky","owens","quota","versa","starr","jumbo","maths","flint","dummy","awake","burnt","studs","roast","petty","felix","shiny","smash","braun","ample","royce","scarf","hated","spicy","fools","beard","wedge","peggy","ruins","denis","hyper","gmail","cites","ezine","gamer","alexa","savvy","terri","norms","silva","prima","zelda","fetal","palms","chord","kudoz","hawks","irons","comet","lotto","syrup","erase","bites","prose","swear","intra","clown","taboo","olson","dwarf","ifdef","pines","fucks","urges","enron","codec","pablo","beams","props","dough","stool","welch","boone","horde","mommy","nanny","roach","angus","ashes","natal","locus","msnbc","elton","prone","clues","crews","timed","scare","thief","motif","hurts","sofia","spear","nigel","jolie","blanc","birch","slash","mikes","seiko","arial","stacy","helix","dixie","shook","matte","heidi","zebra","fetch","faroe","logon","trong","unite","shear","ponds","trump","mates","avian","visas","webmd","champ","recap","astro","crawl","flaws","olsen","hazel","messy","rupee","ments","irene","lungs","vinci","jacks","stole","kirby","quasi","exile","anglo","knots","anton","gerry","kappa","jumps","snoop","vague","wraps","rusty","warns","sting","bravo","secsg","liter","nicht","basil","paced","renee","weiss","giles","shack","sleek","ariel","monty","cafes","hitch","nexus","tango","ernst","sings","carte","queer","pains","vioxx","ahmed","sobre","kuala","comma","geeks","avant","repec","perez","cimel","leica","torah","busch","tiava","freed","cheek","gavin","lasts","httpd","bowel","chats","mafia","lilly","shire","lyons","scams","lipid","clyde","irwin","mains","misty","prism","rests","vegan","corel","groom","osama","weeds","oprah","beers","clive","darby","fills","grips","kayak","altar","gears","risen","rhino","eaton","ruler","henri","swept","troop","arose","becky","lesbo","klaus","hogan","debra","cdrom","corey","slips","trays","flock","chung","boris","shave","swamp","faint","gland","blows","stoke","kauai","ipsec","undef","nasal","nitro","marin","loser","claus","hipaa","porto","jolly","femme","siege","wolfe","tyres","butte","hicks","pratt","chalk","negro","wrath","grind","clint","blitz","osaka","jorge","cooks","rainy","diggs","pluto","mitch","viola","rumor","volts","diver","blaze","wreck","sammy","arabs","brock","hoops","macon","lynne","chloe","prada","plone","horns","kylie","naomi","risky","clair","crete","tulip","ciara","damon","owing","benny","ipods","annum","roche","ropes","morse","cords","warez","ditch","slick","chunk","reels","slept","gregg","huang","ibook","waits","tenor","scrub","cello","caves","cocos","metre","thurs","topaz","soaps","ricoh","gibbs","dusty","patty","crate","kanye","cared","sworn","twink","bowen","beech","frogs","expat","agnes","glibc","maori","tense","basel","oxley","foley","moran","decal","temps","fiona","fritz","mover","erica","macos","betsy","shaun","fauna","detox","spurs","ortho","gould","eliza","usaid","darts","tails","hangs","quark","zyban","dolce","veins","folds","angie","sneak","octet","mccoy","mateo","fread","willy","edith","magna","polly","tidal","jules","ernie","poole","crust","dolly","lenox","miner","cecil","cajun","diner","regis","mound","ethan","ibiza","reese","chefs","pixar","scion","dhtml","winme","mandy","hoods","proto","jared","wears","regal","alvin","raton","curly","hound","wharf","flick","datum","maize","banff","psalm","gowns","luton","leaks","swell","ville","chico","irony","lasik","levin","amiga","viper","gypsy","litre","binds","titus","flare","wight","crank","goats","rains","brace","abdul","ryder","garth","nolan","paolo","argus","mango","thigh","carla","meats","windy","alamo","steer","vogue","aired","vodka","zaire","sakai","knobs","inlog","salts","soups","moist","trina","pests","entre","plano","doris","petit","fries","saxon","stall","deere","serif","monks","aloha","utter","rents","cater","colts","putin","dunes","pinch","flynn","troll","filth","kraft","algae","arden","byrne","shady","erect","vests","lydia","valet","cheng","eliot","jihad","elgin","jonah","raped","denon","sloan","plato","palma","taxis","hates","hague","tammy","ogden","madam","posix","libby","seite","tease","aroma","rowan","dwell","stair","sonny","rotor","quart","bison","fungi","greed","elena","bleed","serie","incur","tempe","cores","nifty","yates","leroy","infos","thanx","ecard","dukes","fudge","homme","rossi","weave","vicki","exits","siena","reiki","dante","lange","rosen","cured","buggy","recon","slack","vines","gorge","liens","musik","boyle","lamar","jonas","locke","cages","pager","jolla","banjo","stout","duane","hanna","pepsi","adler","stare","missy","meade","flair","cette","aisle","dunno","limbs","paved","scots","tyson","econo","seize","spawn","epoxy","stony","punta","crypt","bogus","jboss","faded","mobil","tying","diode","johan","motto","alton","janis","rubin","alain","deter","furry","cubes","linus","rinse","tides","venom","voyer","mummy","cries","ether","sheds","sofas","croix","boing","rosie","terre","techs","elisa","haute","wacky","reits","muddy","nuevo","asean","suche","shalt","visor","mundo","naive","hires","merck","tanya","folio","barre","fiery","fakes","fomit","ahmad","cooke","emule","acorn","bayer","basal","topps","wilde","smoky","flirt","slang","finch","largo","tally","creep","agile","sacks","kiosk","ionic","stray","poppy","suppl","turin","forte","sesso","hanoi","waive","vance","greet","lymph","sonia","bryce","latch","verbs","drank","santo","torso","ramon","dansk","hobbs","mayen","grabs","geile","wards","hinge","patti","faire","emory","stunt","maven","vitae","witty","hertz","flown","silky","micah","repay","await","fetus","cider","gangs","lenny","arxiv","percy","conan","lilac","sinus","denny","hears","lexar","pivot","huron","glide","todos","creme","waltz","paige","blush","monde","malay","modal","cadet","loren","carbs","vdata","opted","tweak","trait","shrek","eater","cymru","cyrus","hides","synth","layup","nazis","piles","bezel","havoc","sling","xoops","rican","gupta","tummy","axial","julio","epoch","plaid","fable","scars","susie","reyes","pesos","spans","obese","sober","tread","avaya","wigan","paddy","norma","astra","mondo","wyatt","otter","earns","sassy","demux","vases","garde","prweb","aries","ramps","dread","qwest","dyson","josef","casts","heinz","argos","needy","reich","weary","tweed","snowy","genie","bling","chars","mcgee","delle","fined","georg","apron","aides","forma","sendo","gomez","corba","yummy","momma","trish","sexes","husky","bland","darth","ching"]



const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

const matchesFilters = (wordList, filters) => {
  return wordList.filter((word) => {
    let match = true;
    for (let i = 0; i < filters.length; i += 1) {
      const { colour, position, letter } = filters[i];
      if (colour === "black") {
        if (word.includes(letter)) {
          match = false;
          break;
        }
      }
      if (colour === "green") {
        if (word[position] !== letter) {
          match = false;
          break;
        }
      }
      if (colour === "yellow") {
        if (!word.includes(letter) || word[position] === letter) {
          match = false;
          break;
        }
      }
    }
    return match;
  });
};


const colours = ["green", "yellow", "black"];

const calculateLetterColor = (wordList, letter, position, colour) => {
  const matchingWords = matchesFilters(wordList, [
    { colour, position, letter },
  ]);
  return {
    p: (matchingWords.length * 1.0) / wordList.length,
    list: matchingWords,
  };
};

const createObject = (word, obj, depth) => {
  // Recursively create decision tree structure
  if (depth > 4) {
    return obj;
  } else {
    // For each colour, add probabilities and new lists
    colours.forEach((colour) => {
      if (!obj[colour] && obj.list.length > 0) {
        obj[colour] = calculateLetterColor(
          obj.list,
          word[depth],
          depth,
          colour
        );
      }
    });
    const newDepth = depth + 1;
    colours.forEach((colour) => {
      if (obj.list.length > 0) {
        createObject(word, obj[colour], newDepth);
      }
    });
  }
};

const fillInObject = (word, originalList) => {
  let depth = 0;
  let composedObj = { list: originalList, p: 1 };
  createObject(word, composedObj, depth);
  return composedObj;
};

const calculateP = (arr, obj, p, depth) => {
  colours.forEach((colour) => {
    if (obj[colour] && obj[colour].list.length > 0) {
      // console.log({ p: obj.p * p, depth });
      if (depth === 4) {
        arr.push(obj[colour].p * p);
      } else {
        calculateP(arr, obj[colour], obj[colour].p * p, depth + 1);
      }
    }
  });
};

const calculateWordScore = (obj, word) => {
  // Go through each branch in tree to multiply probabilities
  // Square each probability and add to array
  // Return the sum of the array
  const pValues = [];
  const depth = 0;
  calculateP(pValues, obj, 1, depth);
  const pSquared = pValues.map((value) => value * value);
  const score = pSquared.reduce((pv, cv) => pv + cv, 0);
  return score;
};

function test(word, constraint) {
  if (constraint[0] === "notInWord") return !word.includes(constraint[1]);
  if (constraint[0] === "notAtPos") {
    const [_, pos, letter] = constraint;
    return word.includes(letter) && word[pos] !== letter;
  }
  if (constraint[0] === "atPos") {
    const [_, pos, letter] = constraint;
    return word[pos] === letter;
  }
  return false;
}

function distinct(xs) {
  return [...new Set(xs)];
}

class Solver {
  constructor() {
    this.wordlist = wordlist.cache.all;
    this.constraints = [];
  }

  getPossibleWords() {
    return this.wordlist.filter((word) =>
      this.constraints.every((constraint) => test(word, constraint))
    );
  }
  guess(guess, out) {
    const newConstraints = [];
    var withoutB = "";
    for (let i = 0; i < guess.length; i++) {
      if (out[i] === "g") {
        newConstraints.push(["atPos", i, guess[i]]);
        withoutB += guess[i];
      } else if (out[i] === "y") {
        newConstraints.push(["notAtPos", i, guess[i]]);
        withoutB += guess[i];
      }
    }
    for (let i = 0; i < guess.length; i++) {
      if (out[i] === "b" && !withoutB.includes(guess[i])) {
        newConstraints.push(["notInWord", guess[i]]);
      }
    }
    this.constraints = this.constraints.concat(newConstraints);
  }

  getNextBestGuesses(n = 1) {
    const possible = this.getPossibleWords();

    const letterCounts = [...possible.join("")].reduce(
      (a, c) => (a[c] = a[c] + 1 || 1) && a,
      {}
    );

    const testedLetters = [];
    for (const constraint of this.constraints) {
      if (constraint[0] === "notInWord") testedLetters.push(constraint[1]);
      else testedLetters.push(constraint[2]);
    }
    const untested = alphabet.filter((l) => !testedLetters.includes(l));
    const l = untested.sort(
      (a, b) => (letterCounts[b] || 0) - (letterCounts[a] || 0)
    );

    if ((letterCounts[l[0]] || 0) <= 1) {
      var scoredCandidates = possible.map((word) => [
        word,
        topwords.indexOf(word) > -1 ? topwords.indexOf(word) : topwords.length,
      ]);
    } else {
      // pick word that has the most probable untested letters
      var scoredCandidates = possible.map((word) => {
        let score = 0;
        for (const letter of distinct(word))
          score += l.includes(letter) ? 1 / (l.indexOf(letter) + 1) : 0;

        //topwords are words that are used a lot, this is because wordle likes uses popular words
        if (topwords.includes(word)) score *= 2;

        return [word, score];
      });
    }
    scoredCandidates = scoredCandidates
      .sort((a, b) => b[1] - a[1])
      .map(([word, score]) => word);
    return scoredCandidates.slice(0, n);
  }

  getNextBestGuess() {
    return this.getNextBestGuesses(1)[0];
  }

  oldSolver(n = 1) {
    var possibleWords = this.getPossibleWords();

    let occur = this.findOccur(possibleWords);
    let freq = this.findPosFreq(possibleWords);

    possibleWords = possibleWords.map((word) => [word, this.findWeight(word, freq, occur)]).sort((a, b) => b[1] - a[1]).map(([word, weight]) => word);
    return possibleWords.slice(0, n);
  }

  nextOldSolver() {
    return this.oldSolver(1)[0];

  }


  getFiltersv3() {
    var filters = [];

    this.constraints.forEach((e) => {
      if(e[0] == "notInWord") filters.push({colour: "black", letter: e[1]})

      else if(e[0] == "atPos") filters.push({colour: "green", letter: e[2], position: e[1]})
      else if(e[0] == "notAtPos") filters.push({colour: "yellow", letter: e[2], position: e[1]})
    })
    return filters;
  }


 nextBestv3()  {

   var filters = this.getFiltersv3()
   if(filters.length == 0) return "raise"
  const filteredList = matchesFilters( wordlist.cache.answers, [...filters]);
  let usedList = wordlist.cache.answers

  let minScore = 1;
  let minWord = usedList[0];

  if (filteredList.length === 1) {
    return filteredList[0]
  } else if (filteredList.length < 4) {
    // Start guessing potential words to see if you get lucky
    usedList = filteredList;
    for (let i = 1; i < usedList.length; i += 1) {
      const oneWordObj = fillInObject(usedList[i], filteredList);
      const score = calculateWordScore(oneWordObj, usedList[i]);
      if (score < minScore) {
        minScore = score;
        minWord = usedList[i];
      }
    }
    return  minWord
  } else {
  var sameScore = [];
    for (let i = 0; i < usedList.length; i += 1) {
     
      const oneWordObj = fillInObject(usedList[i], filteredList);
      const score = calculateWordScore(oneWordObj, usedList[i]);
      if (score <= minScore) {
        minScore = score;
        sameScore.push({word: usedList[i], score: score});
      } 
  
    }
    

    sameScore = sameScore.filter((s) => s.score == minScore)
      
    return sameScore[~~(Math.random() * sameScore.length)].word;
  }
}

  findWeight(guess, freq, occur) {
    let weight = 0;
    let lets = guess.split("");
    lets.forEach((l, i) => (weight += freq[l][i + 1]));
    [...new Set(lets)].forEach((l) => {
      weight += occur[l];
    });
    return weight;
  }

  findOccur(possibleWords) {
    let occurencesByLetter = {};
    alphabet.forEach((letter) => {
      possibleWords.forEach((word) => {
        occurencesByLetter[letter] = occurencesByLetter[letter] || 0;
        occurencesByLetter[letter] += word.replace(
          new RegExp(`[^${letter}]`, "g"),
          ""
        ).length;
      });
    });
    return occurencesByLetter;
  }

  findPosFreq(possibleWords) {
    let freq = {};
    alphabet.forEach((l) => {
      freq[l] = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };
    });
    possibleWords.forEach((word) => {
      let wl = word.split("");
      wl.forEach((letter, index) => {
        freq[letter][index + 1] += 1;
      });
    });
    return freq;
  }
}

module.exports = Solver;

},{"wordle-wordlist":36}],32:[function(require,module,exports){
var Solver = require("./Solver")
module.exports = Solver
},{"./Solver":31}],33:[function(require,module,exports){
module.exports = {
  answers:  ["aback","abase","abate","abbey","abbot","abhor","abide","abled","abode","abort","about","above","abuse","abyss","acorn","acrid","actor","acute","adage","adapt","adept","admin","admit","adobe","adopt","adore","adorn","adult","affix","afire","afoot","afoul","after","again","agape","agate","agent","agile","aging","aglow","agony","agora","agree","ahead","aider","aisle","alarm","album","alert","algae","alibi","alien","align","alike","alive","allay","alley","allot","allow","alloy","aloft","alone","along","aloof","aloud","alpha","altar","alter","amass","amaze","amber","amble","amend","amiss","amity","among","ample","amply","amuse","angel","anger","angle","angry","angst","anime","ankle","annex","annoy","annul","anode","antic","anvil","aorta","apart","aphid","aping","apnea","apple","apply","apron","aptly","arbor","ardor","arena","argue","arise","armor","aroma","arose","array","arrow","arson","artsy","ascot","ashen","aside","askew","assay","asset","atoll","atone","attic","audio","audit","augur","aunty","avail","avert","avian","avoid","await","awake","award","aware","awash","awful","awoke","axial","axiom","axion","azure","bacon","badge","badly","bagel","baggy","baker","baler","balmy","banal","banjo","barge","baron","basal","basic","basil","basin","basis","baste","batch","bathe","baton","batty","bawdy","bayou","beach","beady","beard","beast","beech","beefy","befit","began","begat","beget","begin","begun","being","belch","belie","belle","belly","below","bench","beret","berry","berth","beset","betel","bevel","bezel","bible","bicep","biddy","bigot","bilge","billy","binge","bingo","biome","birch","birth","bison","bitty","black","blade","blame","bland","blank","blare","blast","blaze","bleak","bleat","bleed","bleep","blend","bless","blimp","blind","blink","bliss","blitz","bloat","block","bloke","blond","blood","bloom","blown","bluer","bluff","blunt","blurb","blurt","blush","board","boast","bobby","boney","bongo","bonus","booby","boost","booth","booty","booze","boozy","borax","borne","bosom","bossy","botch","bough","boule","bound","bowel","boxer","brace","braid","brain","brake","brand","brash","brass","brave","bravo","brawl","brawn","bread","break","breed","briar","bribe","brick","bride","brief","brine","bring","brink","briny","brisk","broad","broil","broke","brood","brook","broom","broth","brown","brunt","brush","brute","buddy","budge","buggy","bugle","build","built","bulge","bulky","bully","bunch","bunny","burly","burnt","burst","bused","bushy","butch","butte","buxom","buyer","bylaw","cabal","cabby","cabin","cable","cacao","cache","cacti","caddy","cadet","cagey","cairn","camel","cameo","canal","candy","canny","canoe","canon","caper","caput","carat","cargo","carol","carry","carve","caste","catch","cater","catty","caulk","cause","cavil","cease","cedar","cello","chafe","chaff","chain","chair","chalk","champ","chant","chaos","chard","charm","chart","chase","chasm","cheap","cheat","check","cheek","cheer","chess","chest","chick","chide","chief","child","chili","chill","chime","china","chirp","chock","choir","choke","chord","chore","chose","chuck","chump","chunk","churn","chute","cider","cigar","cinch","circa","civic","civil","clack","claim","clamp","clang","clank","clash","clasp","class","clean","clear","cleat","cleft","clerk","click","cliff","climb","cling","clink","cloak","clock","clone","close","cloth","cloud","clout","clove","clown","cluck","clued","clump","clung","coach","coast","cobra","cocoa","colon","color","comet","comfy","comic","comma","conch","condo","conic","copse","coral","corer","corny","couch","cough","could","count","coupe","court","coven","cover","covet","covey","cower","coyly","crack","craft","cramp","crane","crank","crash","crass","crate","crave","crawl","craze","crazy","creak","cream","credo","creed","creek","creep","creme","crepe","crept","cress","crest","crick","cried","crier","crime","crimp","crisp","croak","crock","crone","crony","crook","cross","croup","crowd","crown","crude","cruel","crumb","crump","crush","crust","crypt","cubic","cumin","curio","curly","curry","curse","curve","curvy","cutie","cyber","cycle","cynic","daddy","daily","dairy","daisy","dally","dance","dandy","datum","daunt","dealt","death","debar","debit","debug","debut","decal","decay","decor","decoy","decry","defer","deign","deity","delay","delta","delve","demon","demur","denim","dense","depot","depth","derby","deter","detox","deuce","devil","diary","dicey","digit","dilly","dimly","diner","dingo","dingy","diode","dirge","dirty","disco","ditch","ditto","ditty","diver","dizzy","dodge","dodgy","dogma","doing","dolly","donor","donut","dopey","doubt","dough","dowdy","dowel","downy","dowry","dozen","draft","drain","drake","drama","drank","drape","drawl","drawn","dread","dream","dress","dried","drier","drift","drill","drink","drive","droit","droll","drone","drool","droop","dross","drove","drown","druid","drunk","dryer","dryly","duchy","dully","dummy","dumpy","dunce","dusky","dusty","dutch","duvet","dwarf","dwell","dwelt","dying","eager","eagle","early","earth","easel","eaten","eater","ebony","eclat","edict","edify","eerie","egret","eight","eject","eking","elate","elbow","elder","elect","elegy","elfin","elide","elite","elope","elude","email","embed","ember","emcee","empty","enact","endow","enema","enemy","enjoy","ennui","ensue","enter","entry","envoy","epoch","epoxy","equal","equip","erase","erect","erode","error","erupt","essay","ester","ether","ethic","ethos","etude","evade","event","every","evict","evoke","exact","exalt","excel","exert","exile","exist","expel","extol","extra","exult","eying","fable","facet","faint","fairy","faith","false","fancy","fanny","farce","fatal","fatty","fault","fauna","favor","feast","fecal","feign","fella","felon","femme","femur","fence","feral","ferry","fetal","fetch","fetid","fetus","fever","fewer","fiber","fibre","ficus","field","fiend","fiery","fifth","fifty","fight","filer","filet","filly","filmy","filth","final","finch","finer","first","fishy","fixer","fizzy","fjord","flack","flail","flair","flake","flaky","flame","flank","flare","flash","flask","fleck","fleet","flesh","flick","flier","fling","flint","flirt","float","flock","flood","floor","flora","floss","flour","flout","flown","fluff","fluid","fluke","flume","flung","flunk","flush","flute","flyer","foamy","focal","focus","foggy","foist","folio","folly","foray","force","forge","forgo","forte","forth","forty","forum","found","foyer","frail","frame","frank","fraud","freak","freed","freer","fresh","friar","fried","frill","frisk","fritz","frock","frond","front","frost","froth","frown","froze","fruit","fudge","fugue","fully","fungi","funky","funny","furor","furry","fussy","fuzzy","gaffe","gaily","gamer","gamma","gamut","gassy","gaudy","gauge","gaunt","gauze","gavel","gawky","gayer","gayly","gazer","gecko","geeky","geese","genie","genre","ghost","ghoul","giant","giddy","gipsy","girly","girth","given","giver","glade","gland","glare","glass","glaze","gleam","glean","glide","glint","gloat","globe","gloom","glory","gloss","glove","glyph","gnash","gnome","godly","going","golem","golly","gonad","goner","goody","gooey","goofy","goose","gorge","gouge","gourd","grace","grade","graft","grail","grain","grand","grant","grape","graph","grasp","grass","grate","grave","gravy","graze","great","greed","green","greet","grief","grill","grime","grimy","grind","gripe","groan","groin","groom","grope","gross","group","grout","grove","growl","grown","gruel","gruff","grunt","guard","guava","guess","guest","guide","guild","guile","guilt","guise","gulch","gully","gumbo","gummy","guppy","gusto","gusty","gypsy","habit","hairy","halve","handy","happy","hardy","harem","harpy","harry","harsh","haste","hasty","hatch","hater","haunt","haute","haven","havoc","hazel","heady","heard","heart","heath","heave","heavy","hedge","hefty","heist","helix","hello","hence","heron","hilly","hinge","hippo","hippy","hitch","hoard","hobby","hoist","holly","homer","honey","honor","horde","horny","horse","hotel","hotly","hound","house","hovel","hover","howdy","human","humid","humor","humph","humus","hunch","hunky","hurry","husky","hussy","hutch","hydro","hyena","hymen","hyper","icily","icing","ideal","idiom","idiot","idler","idyll","igloo","iliac","image","imbue","impel","imply","inane","inbox","incur","index","inept","inert","infer","ingot","inlay","inlet","inner","input","inter","intro","ionic","irate","irony","islet","issue","itchy","ivory","jaunt","jazzy","jelly","jerky","jetty","jewel","jiffy","joint","joist","joker","jolly","joust","judge","juice","juicy","jumbo","jumpy","junta","junto","juror","kappa","karma","kayak","kebab","khaki","kinky","kiosk","kitty","knack","knave","knead","kneed","kneel","knelt","knife","knock","knoll","known","koala","krill","label","labor","laden","ladle","lager","lance","lanky","lapel","lapse","large","larva","lasso","latch","later","lathe","latte","laugh","layer","leach","leafy","leaky","leant","leapt","learn","lease","leash","least","leave","ledge","leech","leery","lefty","legal","leggy","lemon","lemur","leper","level","lever","libel","liege","light","liken","lilac","limbo","limit","linen","liner","lingo","lipid","lithe","liver","livid","llama","loamy","loath","lobby","local","locus","lodge","lofty","logic","login","loopy","loose","lorry","loser","louse","lousy","lover","lower","lowly","loyal","lucid","lucky","lumen","lumpy","lunar","lunch","lunge","lupus","lurch","lurid","lusty","lying","lymph","lynch","lyric","macaw","macho","macro","madam","madly","mafia","magic","magma","maize","major","maker","mambo","mamma","mammy","manga","mange","mango","mangy","mania","manic","manly","manor","maple","march","marry","marsh","mason","masse","match","matey","mauve","maxim","maybe","mayor","mealy","meant","meaty","mecca","medal","media","medic","melee","melon","mercy","merge","merit","merry","metal","meter","metro","micro","midge","midst","might","milky","mimic","mince","miner","minim","minor","minty","minus","mirth","miser","missy","mocha","modal","model","modem","mogul","moist","molar","moldy","money","month","moody","moose","moral","moron","morph","mossy","motel","motif","motor","motto","moult","mound","mount","mourn","mouse","mouth","mover","movie","mower","mucky","mucus","muddy","mulch","mummy","munch","mural","murky","mushy","music","musky","musty","myrrh","nadir","naive","nanny","nasal","nasty","natal","naval","navel","needy","neigh","nerdy","nerve","never","newer","newly","nicer","niche","niece","night","ninja","ninny","ninth","noble","nobly","noise","noisy","nomad","noose","north","nosey","notch","novel","nudge","nurse","nutty","nylon","nymph","oaken","obese","occur","ocean","octal","octet","odder","oddly","offal","offer","often","olden","older","olive","ombre","omega","onion","onset","opera","opine","opium","optic","orbit","order","organ","other","otter","ought","ounce","outdo","outer","outgo","ovary","ovate","overt","ovine","ovoid","owing","owner","oxide","ozone","paddy","pagan","paint","paler","palsy","panel","panic","pansy","papal","paper","parer","parka","parry","parse","party","pasta","paste","pasty","patch","patio","patsy","patty","pause","payee","payer","peace","peach","pearl","pecan","pedal","penal","pence","penne","penny","perch","peril","perky","pesky","pesto","petal","petty","phase","phone","phony","photo","piano","picky","piece","piety","piggy","pilot","pinch","piney","pinky","pinto","piper","pique","pitch","pithy","pivot","pixel","pixie","pizza","place","plaid","plain","plait","plane","plank","plant","plate","plaza","plead","pleat","plied","plier","pluck","plumb","plume","plump","plunk","plush","poesy","point","poise","poker","polar","polka","polyp","pooch","poppy","porch","poser","posit","posse","pouch","pound","pouty","power","prank","prawn","preen","press","price","prick","pride","pried","prime","primo","print","prior","prism","privy","prize","probe","prone","prong","proof","prose","proud","prove","prowl","proxy","prude","prune","psalm","pubic","pudgy","puffy","pulpy","pulse","punch","pupal","pupil","puppy","puree","purer","purge","purse","pushy","putty","pygmy","quack","quail","quake","qualm","quark","quart","quash","quasi","queen","queer","quell","query","quest","queue","quick","quiet","quill","quilt","quirk","quite","quota","quote","quoth","rabbi","rabid","racer","radar","radii","radio","rainy","raise","rajah","rally","ralph","ramen","ranch","randy","range","rapid","rarer","raspy","ratio","ratty","raven","rayon","razor","reach","react","ready","realm","rearm","rebar","rebel","rebus","rebut","recap","recur","recut","reedy","refer","refit","regal","rehab","reign","relax","relay","relic","remit","renal","renew","repay","repel","reply","rerun","reset","resin","retch","retro","retry","reuse","revel","revue","rhino","rhyme","rider","ridge","rifle","right","rigid","rigor","rinse","ripen","riper","risen","riser","risky","rival","river","rivet","roach","roast","robin","robot","rocky","rodeo","roger","rogue","roomy","roost","rotor","rouge","rough","round","rouse","route","rover","rowdy","rower","royal","ruddy","ruder","rugby","ruler","rumba","rumor","rupee","rural","rusty","sadly","safer","saint","salad","sally","salon","salsa","salty","salve","salvo","sandy","saner","sappy","sassy","satin","satyr","sauce","saucy","sauna","saute","savor","savoy","savvy","scald","scale","scalp","scaly","scamp","scant","scare","scarf","scary","scene","scent","scion","scoff","scold","scone","scoop","scope","score","scorn","scour","scout","scowl","scram","scrap","scree","screw","scrub","scrum","scuba","sedan","seedy","segue","seize","semen","sense","sepia","serif","serum","serve","setup","seven","sever","sewer","shack","shade","shady","shaft","shake","shaky","shale","shall","shalt","shame","shank","shape","shard","share","shark","sharp","shave","shawl","shear","sheen","sheep","sheer","sheet","sheik","shelf","shell","shied","shift","shine","shiny","shire","shirk","shirt","shoal","shock","shone","shook","shoot","shore","shorn","short","shout","shove","shown","showy","shrew","shrub","shrug","shuck","shunt","shush","shyly","siege","sieve","sight","sigma","silky","silly","since","sinew","singe","siren","sissy","sixth","sixty","skate","skier","skiff","skill","skimp","skirt","skulk","skull","skunk","slack","slain","slang","slant","slash","slate","slave","sleek","sleep","sleet","slept","slice","slick","slide","slime","slimy","sling","slink","sloop","slope","slosh","sloth","slump","slung","slunk","slurp","slush","slyly","smack","small","smart","smash","smear","smell","smelt","smile","smirk","smite","smith","smock","smoke","smoky","smote","snack","snail","snake","snaky","snare","snarl","sneak","sneer","snide","sniff","snipe","snoop","snore","snort","snout","snowy","snuck","snuff","soapy","sober","soggy","solar","solid","solve","sonar","sonic","sooth","sooty","sorry","sound","south","sower","space","spade","spank","spare","spark","spasm","spawn","speak","spear","speck","speed","spell","spelt","spend","spent","sperm","spice","spicy","spied","spiel","spike","spiky","spill","spilt","spine","spiny","spire","spite","splat","split","spoil","spoke","spoof","spook","spool","spoon","spore","sport","spout","spray","spree","sprig","spunk","spurn","spurt","squad","squat","squib","stack","staff","stage","staid","stain","stair","stake","stale","stalk","stall","stamp","stand","stank","stare","stark","start","stash","state","stave","stead","steak","steal","steam","steed","steel","steep","steer","stein","stern","stick","stiff","still","stilt","sting","stink","stint","stock","stoic","stoke","stole","stomp","stone","stony","stood","stool","stoop","store","stork","storm","story","stout","stove","strap","straw","stray","strip","strut","stuck","study","stuff","stump","stung","stunk","stunt","style","suave","sugar","suing","suite","sulky","sully","sumac","sunny","super","surer","surge","surly","sushi","swami","swamp","swarm","swash","swath","swear","sweat","sweep","sweet","swell","swept","swift","swill","swine","swing","swirl","swish","swoon","swoop","sword","swore","sworn","swung","synod","syrup","tabby","table","taboo","tacit","tacky","taffy","taint","taken","taker","tally","talon","tamer","tango","tangy","taper","tapir","tardy","tarot","taste","tasty","tatty","taunt","tawny","teach","teary","tease","teddy","teeth","tempo","tenet","tenor","tense","tenth","tepee","tepid","terra","terse","testy","thank","theft","their","theme","there","these","theta","thick","thief","thigh","thing","think","third","thong","thorn","those","three","threw","throb","throw","thrum","thumb","thump","thyme","tiara","tibia","tidal","tiger","tight","tilde","timer","timid","tipsy","titan","tithe","title","toast","today","toddy","token","tonal","tonga","tonic","tooth","topaz","topic","torch","torso","torus","total","totem","touch","tough","towel","tower","toxic","toxin","trace","track","tract","trade","trail","train","trait","tramp","trash","trawl","tread","treat","trend","triad","trial","tribe","trice","trick","tried","tripe","trite","troll","troop","trope","trout","trove","truce","truck","truer","truly","trump","trunk","truss","trust","truth","tryst","tubal","tuber","tulip","tulle","tumor","tunic","turbo","tutor","twang","tweak","tweed","tweet","twice","twine","twirl","twist","twixt","tying","udder","ulcer","ultra","umbra","uncle","uncut","under","undid","undue","unfed","unfit","unify","union","unite","unity","unlit","unmet","unset","untie","until","unwed","unzip","upper","upset","urban","urine","usage","usher","using","usual","usurp","utile","utter","vague","valet","valid","valor","value","valve","vapid","vapor","vault","vaunt","vegan","venom","venue","verge","verse","verso","verve","vicar","video","vigil","vigor","villa","vinyl","viola","viper","viral","virus","visit","visor","vista","vital","vivid","vixen","vocal","vodka","vogue","voice","voila","vomit","voter","vouch","vowel","vying","wacky","wafer","wager","wagon","waist","waive","waltz","warty","waste","watch","water","waver","waxen","weary","weave","wedge","weedy","weigh","weird","welch","welsh","wench","whack","whale","wharf","wheat","wheel","whelp","where","which","whiff","while","whine","whiny","whirl","whisk","white","whole","whoop","whose","widen","wider","widow","width","wield","wight","willy","wimpy","wince","winch","windy","wiser","wispy","witch","witty","woken","woman","women","woody","wooer","wooly","woozy","wordy","world","worry","worse","worst","worth","would","wound","woven","wrack","wrath","wreak","wreck","wrest","wring","wrist","write","wrong","wrote","wrung","wryly","yacht","yearn","yeast","yield","young","youth","zebra","zesty","zonal"]
}
},{}],34:[function(require,module,exports){
module.exports = {
  guesses: ["aahed","aalii","aargh","aarti","abaca","abaci","abacs","abaft","abaka","abamp","aband","abash","abask","abaya","abbas","abbed","abbes","abcee","abeam","abear","abele","abers","abets","abies","abler","ables","ablet","ablow","abmho","abohm","aboil","aboma","aboon","abord","abore","abram","abray","abrim","abrin","abris","absey","absit","abuna","abune","abuts","abuzz","abyes","abysm","acais","acari","accas","accoy","acerb","acers","aceta","achar","ached","aches","achoo","acids","acidy","acing","acini","ackee","acker","acmes","acmic","acned","acnes","acock","acold","acred","acres","acros","acted","actin","acton","acyls","adaws","adays","adbot","addax","added","adder","addio","addle","adeem","adhan","adieu","adios","adits","adman","admen","admix","adobo","adown","adoze","adrad","adred","adsum","aduki","adunc","adust","advew","adyta","adzed","adzes","aecia","aedes","aegis","aeons","aerie","aeros","aesir","afald","afara","afars","afear","aflaj","afore","afrit","afros","agama","agami","agars","agast","agave","agaze","agene","agers","agger","aggie","aggri","aggro","aggry","aghas","agila","agios","agism","agist","agita","aglee","aglet","agley","agloo","aglus","agmas","agoge","agone","agons","agood","agria","agrin","agros","agued","agues","aguna","aguti","aheap","ahent","ahigh","ahind","ahing","ahint","ahold","ahull","ahuru","aidas","aided","aides","aidoi","aidos","aiery","aigas","aight","ailed","aimed","aimer","ainee","ainga","aioli","aired","airer","airns","airth","airts","aitch","aitus","aiver","aiyee","aizle","ajies","ajiva","ajuga","ajwan","akees","akela","akene","aking","akita","akkas","alaap","alack","alamo","aland","alane","alang","alans","alant","alapa","alaps","alary","alate","alays","albas","albee","alcid","alcos","aldea","alder","aldol","aleck","alecs","alefs","aleft","aleph","alews","aleye","alfas","algal","algas","algid","algin","algor","algum","alias","alifs","aline","alist","aliya","alkie","alkos","alkyd","alkyl","allee","allel","allis","allod","allyl","almah","almas","almeh","almes","almud","almug","alods","aloed","aloes","aloha","aloin","aloos","alowe","altho","altos","alula","alums","alure","alvar","alway","amahs","amain","amate","amaut","amban","ambit","ambos","ambry","ameba","ameer","amene","amens","ament","amias","amice","amici","amide","amido","amids","amies","amiga","amigo","amine","amino","amins","amirs","amlas","amman","ammon","ammos","amnia","amnic","amnio","amoks","amole","amort","amour","amove","amowt","amped","ampul","amrit","amuck","amyls","anana","anata","ancho","ancle","ancon","andro","anear","anele","anent","angas","anglo","anigh","anile","anils","anima","animi","anion","anise","anker","ankhs","ankus","anlas","annal","annas","annat","anoas","anole","anomy","ansae","antae","antar","antas","anted","antes","antis","antra","antre","antsy","anura","anyon","apace","apage","apaid","apayd","apays","apeak","apeek","apers","apert","apery","apgar","aphis","apian","apiol","apish","apism","apode","apods","apoop","aport","appal","appay","appel","appro","appui","appuy","apres","apses","apsis","apsos","apted","apter","aquae","aquas","araba","araks","arame","arars","arbas","arced","archi","arcos","arcus","ardeb","ardri","aread","areae","areal","arear","areas","areca","aredd","arede","arefy","areic","arene","arepa","arere","arete","arets","arett","argal","argan","argil","argle","argol","argon","argot","argus","arhat","arias","ariel","ariki","arils","ariot","arish","arked","arled","arles","armed","armer","armet","armil","arnas","arnut","aroba","aroha","aroid","arpas","arpen","arrah","arras","arret","arris","arroz","arsed","arses","arsey","arsis","artal","artel","artic","artis","aruhe","arums","arval","arvee","arvos","aryls","asana","ascon","ascus","asdic","ashed","ashes","ashet","asked","asker","askoi","askos","aspen","asper","aspic","aspie","aspis","aspro","assai","assam","asses","assez","assot","aster","astir","astun","asura","asway","aswim","asyla","ataps","ataxy","atigi","atilt","atimy","atlas","atman","atmas","atmos","atocs","atoke","atoks","atoms","atomy","atony","atopy","atria","atrip","attap","attar","atuas","audad","auger","aught","aulas","aulic","auloi","aulos","aumil","aunes","aunts","aurae","aural","aurar","auras","aurei","aures","auric","auris","aurum","autos","auxin","avale","avant","avast","avels","avens","avers","avgas","avine","avion","avise","aviso","avize","avows","avyze","awarn","awato","awave","aways","awdls","aweel","aweto","awing","awmry","awned","awner","awols","awork","axels","axile","axils","axing","axite","axled","axles","axman","axmen","axoid","axone","axons","ayahs","ayaya","ayelp","aygre","ayins","ayont","ayres","ayrie","azans","azide","azido","azine","azlon","azoic","azole","azons","azote","azoth","azuki","azurn","azury","azygy","azyme","azyms","baaed","baals","babas","babel","babes","babka","baboo","babul","babus","bacca","bacco","baccy","bacha","bachs","backs","baddy","baels","baffs","baffy","bafts","baghs","bagie","bahts","bahus","bahut","bails","bairn","baisa","baith","baits","baiza","baize","bajan","bajra","bajri","bajus","baked","baken","bakes","bakra","balas","balds","baldy","baled","bales","balks","balky","balls","bally","balms","baloo","balsa","balti","balun","balus","bambi","banak","banco","bancs","banda","bandh","bands","bandy","baned","banes","bangs","bania","banks","banns","bants","bantu","banty","banya","bapus","barbe","barbs","barby","barca","barde","bardo","bards","bardy","bared","barer","bares","barfi","barfs","baric","barks","barky","barms","barmy","barns","barny","barps","barra","barre","barro","barry","barye","basan","based","basen","baser","bases","basho","basij","basks","bason","basse","bassi","basso","bassy","basta","basti","basto","basts","bated","bates","baths","batik","batta","batts","battu","bauds","bauks","baulk","baurs","bavin","bawds","bawks","bawls","bawns","bawrs","bawty","bayed","bayer","bayes","bayle","bayts","bazar","bazoo","beads","beaks","beaky","beals","beams","beamy","beano","beans","beany","beare","bears","beath","beats","beaty","beaus","beaut","beaux","bebop","becap","becke","becks","bedad","bedel","bedes","bedew","bedim","bedye","beedi","beefs","beeps","beers","beery","beets","befog","begad","begar","begem","begot","begum","beige","beigy","beins","bekah","belah","belar","belay","belee","belga","bells","belon","belts","bemad","bemas","bemix","bemud","bends","bendy","benes","benet","benga","benis","benne","benni","benny","bento","bents","benty","bepat","beray","beres","bergs","berko","berks","berme","berms","berob","beryl","besat","besaw","besee","beses","besit","besom","besot","besti","bests","betas","beted","betes","beths","betid","beton","betta","betty","bever","bevor","bevue","bevvy","bewet","bewig","bezes","bezil","bezzy","bhais","bhaji","bhang","bhats","bhels","bhoot","bhuna","bhuts","biach","biali","bialy","bibbs","bibes","biccy","bices","bided","bider","bides","bidet","bidis","bidon","bield","biers","biffo","biffs","biffy","bifid","bigae","biggs","biggy","bigha","bight","bigly","bigos","bijou","biked","biker","bikes","bikie","bilbo","bilby","biled","biles","bilgy","bilks","bills","bimah","bimas","bimbo","binal","bindi","binds","biner","bines","bings","bingy","binit","binks","bints","biogs","biont","biota","biped","bipod","birds","birks","birle","birls","biros","birrs","birse","birsy","bises","bisks","bisom","bitch","biter","bites","bitos","bitou","bitsy","bitte","bitts","bivia","bivvy","bizes","bizzo","bizzy","blabs","blads","blady","blaer","blaes","blaff","blags","blahs","blain","blams","blart","blase","blash","blate","blats","blatt","blaud","blawn","blaws","blays","blear","blebs","blech","blees","blent","blert","blest","blets","bleys","blimy","bling","blini","blins","bliny","blips","blist","blite","blits","blive","blobs","blocs","blogs","blook","bloop","blore","blots","blows","blowy","blubs","blude","bluds","bludy","blued","blues","bluet","bluey","bluid","blume","blunk","blurs","blype","boabs","boaks","boars","boart","boats","bobac","bobak","bobas","bobol","bobos","bocca","bocce","bocci","boche","bocks","boded","bodes","bodge","bodhi","bodle","boeps","boets","boeuf","boffo","boffs","bogan","bogey","boggy","bogie","bogle","bogue","bogus","bohea","bohos","boils","boing","boink","boite","boked","bokeh","bokes","bokos","bolar","bolas","bolds","boles","bolix","bolls","bolos","bolts","bolus","bomas","bombe","bombo","bombs","bonce","bonds","boned","boner","bones","bongs","bonie","bonks","bonne","bonny","bonza","bonze","booai","booay","boobs","boody","booed","boofy","boogy","boohs","books","booky","bools","booms","boomy","boong","boons","boord","boors","boose","boots","boppy","borak","boral","boras","borde","bords","bored","boree","borel","borer","bores","borgo","boric","borks","borms","borna","boron","borts","borty","bortz","bosie","bosks","bosky","boson","bosun","botas","botel","botes","bothy","botte","botts","botty","bouge","bouks","boult","bouns","bourd","bourg","bourn","bouse","bousy","bouts","bovid","bowat","bowed","bower","bowes","bowet","bowie","bowls","bowne","bowrs","bowse","boxed","boxen","boxes","boxla","boxty","boyar","boyau","boyed","boyfs","boygs","boyla","boyos","boysy","bozos","braai","brach","brack","bract","brads","braes","brags","brail","braks","braky","brame","brane","brank","brans","brant","brast","brats","brava","bravi","braws","braxy","brays","braza","braze","bream","brede","breds","breem","breer","brees","breid","breis","breme","brens","brent","brere","brers","breve","brews","breys","brier","bries","brigs","briki","briks","brill","brims","brins","brios","brise","briss","brith","brits","britt","brize","broch","brock","brods","brogh","brogs","brome","bromo","bronc","brond","brool","broos","brose","brosy","brows","brugh","bruin","bruit","brule","brume","brung","brusk","brust","bruts","buats","buaze","bubal","bubas","bubba","bubbe","bubby","bubus","buchu","bucko","bucks","bucku","budas","budis","budos","buffa","buffe","buffi","buffo","buffs","buffy","bufos","bufty","buhls","buhrs","buiks","buist","bukes","bulbs","bulgy","bulks","bulla","bulls","bulse","bumbo","bumfs","bumph","bumps","bumpy","bunas","bunce","bunco","bunde","bundh","bunds","bundt","bundu","bundy","bungs","bungy","bunia","bunje","bunjy","bunko","bunks","bunns","bunts","bunty","bunya","buoys","buppy","buran","buras","burbs","burds","buret","burfi","burgh","burgs","burin","burka","burke","burks","burls","burns","buroo","burps","burqa","burro","burrs","burry","bursa","burse","busby","buses","busks","busky","bussu","busti","busts","busty","buteo","butes","butle","butoh","butts","butty","butut","butyl","buzzy","bwana","bwazi","byded","bydes","byked","bykes","byres","byrls","byssi","bytes","byway","caaed","cabas","caber","cabob","caboc","cabre","cacas","cacks","cacky","cadee","cades","cadge","cadgy","cadie","cadis","cadre","caeca","caese","cafes","caffs","caged","cager","cages","cagot","cahow","caids","cains","caird","cajon","cajun","caked","cakes","cakey","calfs","calid","calif","calix","calks","calla","calls","calms","calmy","calos","calpa","calps","calve","calyx","caman","camas","cames","camis","camos","campi","campo","camps","campy","camus","caned","caneh","caner","canes","cangs","canid","canna","canns","canso","canst","canto","cants","canty","capas","caped","capes","capex","caphs","capiz","caple","capon","capos","capot","capri","capul","carap","carbo","carbs","carby","cardi","cards","cardy","cared","carer","cares","caret","carex","carks","carle","carls","carns","carny","carob","carom","caron","carpi","carps","carrs","carse","carta","carte","carts","carvy","casas","casco","cased","cases","casks","casky","casts","casus","cates","cauda","cauks","cauld","cauls","caums","caups","cauri","causa","cavas","caved","cavel","caver","caves","cavie","cawed","cawks","caxon","ceaze","cebid","cecal","cecum","ceded","ceder","cedes","cedis","ceiba","ceili","ceils","celeb","cella","celli","cells","celom","celts","cense","cento","cents","centu","ceorl","cepes","cerci","cered","ceres","cerge","ceria","ceric","cerne","ceroc","ceros","certs","certy","cesse","cesta","cesti","cetes","cetyl","cezve","chace","chack","chaco","chado","chads","chaft","chais","chals","chams","chana","chang","chank","chape","chaps","chapt","chara","chare","chark","charr","chars","chary","chats","chave","chavs","chawk","chaws","chaya","chays","cheep","chefs","cheka","chela","chelp","chemo","chems","chere","chert","cheth","chevy","chews","chewy","chiao","chias","chibs","chica","chich","chico","chics","chiel","chiks","chile","chimb","chimo","chimp","chine","ching","chink","chino","chins","chips","chirk","chirl","chirm","chiro","chirr","chirt","chiru","chits","chive","chivs","chivy","chizz","choco","chocs","chode","chogs","choil","choko","choky","chola","choli","cholo","chomp","chons","choof","chook","choom","choon","chops","chota","chott","chout","choux","chowk","chows","chubs","chufa","chuff","chugs","chums","churl","churr","chuse","chuts","chyle","chyme","chynd","cibol","cided","cides","ciels","ciggy","cilia","cills","cimar","cimex","cinct","cines","cinqs","cions","cippi","circs","cires","cirls","cirri","cisco","cissy","cists","cital","cited","citer","cites","cives","civet","civie","civvy","clach","clade","clads","claes","clags","clame","clams","clans","claps","clapt","claro","clart","clary","clast","clats","claut","clave","clavi","claws","clays","cleck","cleek","cleep","clefs","clegs","cleik","clems","clepe","clept","cleve","clews","clied","clies","clift","clime","cline","clint","clipe","clips","clipt","clits","cloam","clods","cloff","clogs","cloke","clomb","clomp","clonk","clons","cloop","cloot","clops","clote","clots","clour","clous","clows","cloye","cloys","cloze","clubs","clues","cluey","clunk","clype","cnida","coact","coady","coala","coals","coaly","coapt","coarb","coate","coati","coats","cobbs","cobby","cobia","coble","cobza","cocas","cocci","cocco","cocks","cocky","cocos","codas","codec","coded","coden","coder","codes","codex","codon","coeds","coffs","cogie","cogon","cogue","cohab","cohen","cohoe","cohog","cohos","coifs","coign","coils","coins","coirs","coits","coked","cokes","colas","colby","colds","coled","coles","coley","colic","colin","colls","colly","colog","colts","colza","comae","comal","comas","combe","combi","combo","combs","comby","comer","comes","comix","commo","comms","commy","compo","comps","compt","comte","comus","coned","cones","coney","confs","conga","conge","congo","conia","conin","conks","conky","conne","conns","conte","conto","conus","convo","cooch","cooed","cooee","cooer","cooey","coofs","cooks","cooky","cools","cooly","coomb","cooms","coomy","coons","coops","coopt","coost","coots","cooze","copal","copay","coped","copen","coper","copes","coppy","copra","copsy","coqui","coram","corbe","corby","cords","cored","cores","corey","corgi","coria","corks","corky","corms","corni","corno","corns","cornu","corps","corse","corso","cosec","cosed","coses","coset","cosey","cosie","costa","coste","costs","cotan","coted","cotes","coths","cotta","cotts","coude","coups","courb","courd","coure","cours","couta","couth","coved","coves","covin","cowal","cowan","cowed","cowks","cowls","cowps","cowry","coxae","coxal","coxed","coxes","coxib","coyau","coyed","coyer","coypu","cozed","cozen","cozes","cozey","cozie","craal","crabs","crags","craic","craig","crake","crame","crams","crans","crape","craps","crapy","crare","craws","crays","creds","creel","crees","crems","crena","creps","crepy","crewe","crews","crias","cribs","cries","crims","crine","crios","cripe","crips","crise","crith","crits","croci","crocs","croft","crogs","cromb","crome","cronk","crons","crool","croon","crops","crore","crost","crout","crows","croze","cruck","crudo","cruds","crudy","crues","cruet","cruft","crunk","cruor","crura","cruse","crusy","cruve","crwth","cryer","ctene","cubby","cubeb","cubed","cuber","cubes","cubit","cuddy","cuffo","cuffs","cuifs","cuing","cuish","cuits","cukes","culch","culet","culex","culls","cully","culms","culpa","culti","cults","culty","cumec","cundy","cunei","cunit","cunts","cupel","cupid","cuppa","cuppy","curat","curbs","curch","curds","curdy","cured","curer","cures","curet","curfs","curia","curie","curli","curls","curns","curny","currs","cursi","curst","cusec","cushy","cusks","cusps","cuspy","cusso","cusum","cutch","cuter","cutes","cutey","cutin","cutis","cutto","cutty","cutup","cuvee","cuzes","cwtch","cyano","cyans","cycad","cycas","cyclo","cyder","cylix","cymae","cymar","cymas","cymes","cymol","cysts","cytes","cyton","czars","daals","dabba","daces","dacha","dacks","dadah","dadas","dados","daffs","daffy","dagga","daggy","dagos","dahls","daiko","daine","daint","daker","daled","dales","dalis","dalle","dalts","daman","damar","dames","damme","damns","damps","dampy","dancy","dangs","danio","danks","danny","dants","daraf","darbs","darcy","dared","darer","dares","darga","dargs","daric","daris","darks","darky","darns","darre","darts","darzi","dashi","dashy","datal","dated","dater","dates","datos","datto","daube","daubs","dauby","dauds","dault","daurs","dauts","daven","davit","dawah","dawds","dawed","dawen","dawks","dawns","dawts","dayan","daych","daynt","dazed","dazer","dazes","deads","deair","deals","deans","deare","dearn","dears","deary","deash","deave","deaws","deawy","debag","debby","debel","debes","debts","debud","debur","debus","debye","decad","decaf","decan","decko","decks","decos","dedal","deeds","deedy","deely","deems","deens","deeps","deere","deers","deets","deeve","deevs","defat","deffo","defis","defog","degas","degum","degus","deice","deids","deify","deils","deism","deist","deked","dekes","dekko","deled","deles","delfs","delft","delis","dells","delly","delos","delph","delts","deman","demes","demic","demit","demob","demoi","demos","dempt","denar","denay","dench","denes","denet","denis","dents","deoxy","derat","deray","dered","deres","derig","derma","derms","derns","derny","deros","derro","derry","derth","dervs","desex","deshi","desis","desks","desse","devas","devel","devis","devon","devos","devot","dewan","dewar","dewax","dewed","dexes","dexie","dhaba","dhaks","dhals","dhikr","dhobi","dhole","dholl","dhols","dhoti","dhows","dhuti","diact","dials","diane","diazo","dibbs","diced","dicer","dices","dicht","dicks","dicky","dicot","dicta","dicts","dicty","diddy","didie","didos","didst","diebs","diels","diene","diets","diffs","dight","dikas","diked","diker","dikes","dikey","dildo","dilli","dills","dimbo","dimer","dimes","dimps","dinar","dined","dines","dinge","dings","dinic","dinks","dinky","dinna","dinos","dints","diols","diota","dippy","dipso","diram","direr","dirke","dirks","dirls","dirts","disas","disci","discs","dishy","disks","disme","dital","ditas","dited","dites","ditsy","ditts","ditzy","divan","divas","dived","dives","divis","divna","divos","divot","divvy","diwan","dixie","dixit","diyas","dizen","djinn","djins","doabs","doats","dobby","dobes","dobie","dobla","dobra","dobro","docht","docks","docos","docus","doddy","dodos","doeks","doers","doest","doeth","doffs","dogan","doges","dogey","doggo","doggy","dogie","dohyo","doilt","doily","doits","dojos","dolce","dolci","doled","doles","dolia","dolls","dolma","dolor","dolos","dolts","domal","domed","domes","domic","donah","donas","donee","doner","donga","dongs","donko","donna","donne","donny","donsy","doobs","dooce","doody","dooks","doole","dools","dooly","dooms","doomy","doona","doorn","doors","doozy","dopas","doped","doper","dopes","dorad","dorba","dorbs","doree","dores","doric","doris","dorks","dorky","dorms","dormy","dorps","dorrs","dorsa","dorse","dorts","dorty","dosai","dosas","dosed","doseh","doser","doses","dosha","dotal","doted","doter","dotes","dotty","douar","douce","doucs","douks","doula","douma","doums","doups","doura","douse","douts","doved","doven","dover","doves","dovie","dowar","dowds","dowed","dower","dowie","dowle","dowls","dowly","downa","downs","dowps","dowse","dowts","doxed","doxes","doxie","doyen","doyly","dozed","dozer","dozes","drabs","drack","draco","draff","drags","drail","drams","drant","draps","drats","drave","draws","drays","drear","dreck","dreed","dreer","drees","dregs","dreks","drent","drere","drest","dreys","dribs","drice","dries","drily","drips","dript","droid","droil","droke","drole","drome","drony","droob","droog","drook","drops","dropt","drouk","drows","drubs","drugs","drums","drupe","druse","drusy","druxy","dryad","dryas","dsobo","dsomo","duads","duals","duans","duars","dubbo","ducal","ducat","duces","ducks","ducky","ducts","duddy","duded","dudes","duels","duets","duett","duffs","dufus","duing","duits","dukas","duked","dukes","dukka","dulce","dules","dulia","dulls","dulse","dumas","dumbo","dumbs","dumka","dumky","dumps","dunam","dunch","dunes","dungs","dungy","dunks","dunno","dunny","dunsh","dunts","duomi","duomo","duped","duper","dupes","duple","duply","duppy","dural","duras","dured","dures","durgy","durns","duroc","duros","duroy","durra","durrs","durry","durst","durum","durzi","dusks","dusts","duxes","dwaal","dwale","dwalm","dwams","dwang","dwaum","dweeb","dwile","dwine","dyads","dyers","dyked","dykes","dykey","dykon","dynel","dynes","dzhos","eagre","ealed","eales","eaned","eards","eared","earls","earns","earnt","earst","eased","easer","eases","easle","easts","eathe","eaved","eaves","ebbed","ebbet","ebons","ebook","ecads","eched","eches","echos","ecrus","edema","edged","edger","edges","edile","edits","educe","educt","eejit","eensy","eeven","eevns","effed","egads","egers","egest","eggar","egged","egger","egmas","ehing","eider","eidos","eigne","eiked","eikon","eilds","eisel","ejido","ekkas","elain","eland","elans","elchi","eldin","elemi","elfed","eliad","elint","elmen","eloge","elogy","eloin","elops","elpee","elsin","elute","elvan","elven","elver","elves","emacs","embar","embay","embog","embow","embox","embus","emeer","emend","emerg","emery","emeus","emics","emirs","emits","emmas","emmer","emmet","emmew","emmys","emoji","emong","emote","emove","empts","emule","emure","emyde","emyds","enarm","enate","ended","ender","endew","endue","enews","enfix","eniac","enlit","enmew","ennog","enoki","enols","enorm","enows","enrol","ensew","ensky","entia","enure","enurn","envoi","enzym","eorls","eosin","epact","epees","ephah","ephas","ephod","ephor","epics","epode","epopt","epris","eques","equid","erbia","erevs","ergon","ergos","ergot","erhus","erica","erick","erics","ering","erned","ernes","erose","erred","erses","eruct","erugo","eruvs","erven","ervil","escar","escot","esile","eskar","esker","esnes","esses","estoc","estop","estro","etage","etape","etats","etens","ethal","ethne","ethyl","etics","etnas","ettin","ettle","etuis","etwee","etyma","eughs","euked","eupad","euros","eusol","evens","evert","evets","evhoe","evils","evite","evohe","ewers","ewest","ewhow","ewked","exams","exeat","execs","exeem","exeme","exfil","exies","exine","exing","exits","exode","exome","exons","expat","expos","exude","exuls","exurb","eyass","eyers","eyots","eyras","eyres","eyrie","eyrir","ezine","fabby","faced","facer","faces","facia","facta","facts","faddy","faded","fader","fades","fadge","fados","faena","faery","faffs","faffy","faggy","fagin","fagot","faiks","fails","faine","fains","fairs","faked","faker","fakes","fakey","fakie","fakir","falaj","falls","famed","fames","fanal","fands","fanes","fanga","fango","fangs","fanks","fanon","fanos","fanum","faqir","farad","farci","farcy","fards","fared","farer","fares","farle","farls","farms","faros","farro","farse","farts","fasci","fasti","fasts","fated","fates","fatly","fatso","fatwa","faugh","fauld","fauns","faurd","fauts","fauve","favas","favel","faver","faves","favus","fawns","fawny","faxed","faxes","fayed","fayer","fayne","fayre","fazed","fazes","feals","feare","fears","feart","fease","feats","feaze","feces","fecht","fecit","fecks","fedex","feebs","feeds","feels","feens","feers","feese","feeze","fehme","feint","feist","felch","felid","fells","felly","felts","felty","femal","femes","femmy","fends","fendy","fenis","fenks","fenny","fents","feods","feoff","ferer","feres","feria","ferly","fermi","ferms","ferns","ferny","fesse","festa","fests","festy","fetas","feted","fetes","fetor","fetta","fetts","fetwa","feuar","feuds","feued","feyed","feyer","feyly","fezes","fezzy","fiars","fiats","fibro","fices","fiche","fichu","ficin","ficos","fides","fidge","fidos","fiefs","fient","fiere","fiers","fiest","fifed","fifer","fifes","fifis","figgy","figos","fiked","fikes","filar","filch","filed","files","filii","filks","fille","fillo","fills","filmi","films","filos","filum","finca","finds","fined","fines","finis","finks","finny","finos","fiord","fiqhs","fique","fired","firer","fires","firie","firks","firms","firns","firry","firth","fiscs","fisks","fists","fisty","fitch","fitly","fitna","fitte","fitts","fiver","fives","fixed","fixes","fixit","fjeld","flabs","flaff","flags","flaks","flamm","flams","flamy","flane","flans","flaps","flary","flats","flava","flawn","flaws","flawy","flaxy","flays","fleam","fleas","fleek","fleer","flees","flegs","fleme","fleur","flews","flexi","flexo","fleys","flics","flied","flies","flimp","flims","flips","flirs","flisk","flite","flits","flitt","flobs","flocs","floes","flogs","flong","flops","flors","flory","flosh","flota","flote","flows","flubs","flued","flues","fluey","fluky","flump","fluor","flurr","fluty","fluyt","flyby","flype","flyte","foals","foams","foehn","fogey","fogie","fogle","fogou","fohns","foids","foils","foins","folds","foley","folia","folic","folie","folks","folky","fomes","fonda","fonds","fondu","fones","fonly","fonts","foods","foody","fools","foots","footy","foram","forbs","forby","fordo","fords","forel","fores","forex","forks","forky","forme","forms","forts","forza","forze","fossa","fosse","fouat","fouds","fouer","fouet","foule","fouls","fount","fours","fouth","fovea","fowls","fowth","foxed","foxes","foxie","foyle","foyne","frabs","frack","fract","frags","fraim","franc","frape","fraps","frass","frate","frati","frats","fraus","frays","frees","freet","freit","fremd","frena","freon","frere","frets","fribs","frier","fries","frigs","frise","frist","frith","frits","fritt","frize","frizz","froes","frogs","frons","frore","frorn","frory","frosh","frows","frowy","frugs","frump","frush","frust","fryer","fubar","fubby","fubsy","fucks","fucus","fuddy","fudgy","fuels","fuero","fuffs","fuffy","fugal","fuggy","fugie","fugio","fugle","fugly","fugus","fujis","fulls","fumed","fumer","fumes","fumet","fundi","funds","fundy","fungo","fungs","funks","fural","furan","furca","furls","furol","furrs","furth","furze","furzy","fused","fusee","fusel","fuses","fusil","fusks","fusts","fusty","futon","fuzed","fuzee","fuzes","fuzil","fyces","fyked","fykes","fyles","fyrds","fytte","gabba","gabby","gable","gaddi","gades","gadge","gadid","gadis","gadje","gadjo","gadso","gaffs","gaged","gager","gages","gaids","gains","gairs","gaita","gaits","gaitt","gajos","galah","galas","galax","galea","galed","gales","galls","gally","galop","galut","galvo","gamas","gamay","gamba","gambe","gambo","gambs","gamed","games","gamey","gamic","gamin","gamme","gammy","gamps","ganch","gandy","ganef","ganev","gangs","ganja","ganof","gants","gaols","gaped","gaper","gapes","gapos","gappy","garbe","garbo","garbs","garda","gares","garis","garms","garni","garre","garth","garum","gases","gasps","gaspy","gasts","gatch","gated","gater","gates","gaths","gator","gauch","gaucy","gauds","gauje","gault","gaums","gaumy","gaups","gaurs","gauss","gauzy","gavot","gawcy","gawds","gawks","gawps","gawsy","gayal","gazal","gazar","gazed","gazes","gazon","gazoo","geals","geans","geare","gears","geats","gebur","gecks","geeks","geeps","geest","geist","geits","gelds","gelee","gelid","gelly","gelts","gemel","gemma","gemmy","gemot","genal","genas","genes","genet","genic","genii","genip","genny","genoa","genom","genro","gents","genty","genua","genus","geode","geoid","gerah","gerbe","geres","gerle","germs","germy","gerne","gesse","gesso","geste","gests","getas","getup","geums","geyan","geyer","ghast","ghats","ghaut","ghazi","ghees","ghest","ghyll","gibed","gibel","giber","gibes","gibli","gibus","gifts","gigas","gighe","gigot","gigue","gilas","gilds","gilet","gills","gilly","gilpy","gilts","gimel","gimme","gimps","gimpy","ginch","ginge","gings","ginks","ginny","ginzo","gipon","gippo","gippy","girds","girls","girns","giron","giros","girrs","girsh","girts","gismo","gisms","gists","gitch","gites","giust","gived","gives","gizmo","glace","glads","glady","glaik","glair","glams","glans","glary","glaum","glaur","glazy","gleba","glebe","gleby","glede","gleds","gleed","gleek","glees","gleet","gleis","glens","glent","gleys","glial","glias","glibs","gliff","glift","glike","glime","glims","glisk","glits","glitz","gloam","globi","globs","globy","glode","glogg","gloms","gloop","glops","glost","glout","glows","gloze","glued","gluer","glues","gluey","glugs","glume","glums","gluon","glute","gluts","gnarl","gnarr","gnars","gnats","gnawn","gnaws","gnows","goads","goafs","goals","goary","goats","goaty","goban","gobar","gobbi","gobbo","gobby","gobis","gobos","godet","godso","goels","goers","goest","goeth","goety","gofer","goffs","gogga","gogos","goier","gojis","golds","goldy","goles","golfs","golpe","golps","gombo","gomer","gompa","gonch","gonef","gongs","gonia","gonif","gonks","gonna","gonof","gonys","gonzo","gooby","goods","goofs","googs","gooks","gooky","goold","gools","gooly","goons","goony","goops","goopy","goors","goory","goosy","gopak","gopik","goral","goras","gored","gores","goris","gorms","gormy","gorps","gorse","gorsy","gosht","gosse","gotch","goths","gothy","gotta","gouch","gouks","goura","gouts","gouty","gowan","gowds","gowfs","gowks","gowls","gowns","goxes","goyim","goyle","graal","grabs","grads","graff","graip","grama","grame","gramp","grams","grana","grans","grapy","gravs","grays","grebe","grebo","grece","greek","grees","grege","grego","grein","grens","grese","greve","grews","greys","grice","gride","grids","griff","grift","grigs","grike","grins","griot","grips","gript","gripy","grise","grist","grisy","grith","grits","grize","groat","grody","grogs","groks","groma","grone","groof","grosz","grots","grouf","grovy","grows","grrls","grrrl","grubs","grued","grues","grufe","grume","grump","grund","gryce","gryde","gryke","grype","grypt","guaco","guana","guano","guans","guars","gucks","gucky","gudes","guffs","gugas","guids","guimp","guiro","gulag","gular","gulas","gules","gulet","gulfs","gulfy","gulls","gulph","gulps","gulpy","gumma","gummi","gumps","gundy","gunge","gungy","gunks","gunky","gunny","guqin","gurdy","gurge","gurls","gurly","gurns","gurry","gursh","gurus","gushy","gusla","gusle","gusli","gussy","gusts","gutsy","gutta","gutty","guyed","guyle","guyot","guyse","gwine","gyals","gyans","gybed","gybes","gyeld","gymps","gynae","gynie","gynny","gynos","gyoza","gypos","gyppo","gyppy","gyral","gyred","gyres","gyron","gyros","gyrus","gytes","gyved","gyves","haafs","haars","hable","habus","hacek","hacks","hadal","haded","hades","hadji","hadst","haems","haets","haffs","hafiz","hafts","haggs","hahas","haick","haika","haiks","haiku","hails","haily","hains","haint","hairs","haith","hajes","hajis","hajji","hakam","hakas","hakea","hakes","hakim","hakus","halal","haled","haler","hales","halfa","halfs","halid","hallo","halls","halma","halms","halon","halos","halse","halts","halva","halwa","hamal","hamba","hamed","hames","hammy","hamza","hanap","hance","hanch","hands","hangi","hangs","hanks","hanky","hansa","hanse","hants","haole","haoma","hapax","haply","happi","hapus","haram","hards","hared","hares","harim","harks","harls","harms","harns","haros","harps","harts","hashy","hasks","hasps","hasta","hated","hates","hatha","hauds","haufs","haugh","hauld","haulm","hauls","hault","hauns","hause","haver","haves","hawed","hawks","hawms","hawse","hayed","hayer","hayey","hayle","hazan","hazed","hazer","hazes","heads","heald","heals","heame","heaps","heapy","heare","hears","heast","heats","heben","hebes","hecht","hecks","heder","hedgy","heeds","heedy","heels","heeze","hefte","hefts","heids","heigh","heils","heirs","hejab","hejra","heled","heles","helio","hells","helms","helos","helot","helps","helve","hemal","hemes","hemic","hemin","hemps","hempy","hench","hends","henge","henna","henny","henry","hents","hepar","herbs","herby","herds","heres","herls","herma","herms","herns","heros","herry","herse","hertz","herye","hesps","hests","hetes","heths","heuch","heugh","hevea","hewed","hewer","hewgh","hexad","hexed","hexer","hexes","hexyl","heyed","hiant","hicks","hided","hider","hides","hiems","highs","hight","hijab","hijra","hiked","hiker","hikes","hikoi","hilar","hilch","hillo","hills","hilts","hilum","hilus","himbo","hinau","hinds","hings","hinky","hinny","hints","hiois","hiply","hired","hiree","hirer","hires","hissy","hists","hithe","hived","hiver","hives","hizen","hoaed","hoagy","hoars","hoary","hoast","hobos","hocks","hocus","hodad","hodja","hoers","hogan","hogen","hoggs","hoghs","hohed","hoick","hoied","hoiks","hoing","hoise","hokas","hoked","hokes","hokey","hokis","hokku","hokum","holds","holed","holes","holey","holks","holla","hollo","holme","holms","holon","holos","holts","homas","homed","homes","homey","homie","homme","homos","honan","honda","honds","honed","honer","hones","hongi","hongs","honks","honky","hooch","hoods","hoody","hooey","hoofs","hooka","hooks","hooky","hooly","hoons","hoops","hoord","hoors","hoosh","hoots","hooty","hoove","hopak","hoped","hoper","hopes","hoppy","horah","horal","horas","horis","horks","horme","horns","horst","horsy","hosed","hosel","hosen","hoser","hoses","hosey","hosta","hosts","hotch","hoten","hotty","houff","houfs","hough","houri","hours","houts","hovea","hoved","hoven","hoves","howbe","howes","howff","howfs","howks","howls","howre","howso","hoxed","hoxes","hoyas","hoyed","hoyle","hubby","hucks","hudna","hudud","huers","huffs","huffy","huger","huggy","huhus","huias","hulas","hules","hulks","hulky","hullo","hulls","hully","humas","humfs","humic","humps","humpy","hunks","hunts","hurds","hurls","hurly","hurra","hurst","hurts","hushy","husks","husos","hutia","huzza","huzzy","hwyls","hydra","hyens","hygge","hying","hykes","hylas","hyleg","hyles","hylic","hymns","hynde","hyoid","hyped","hypes","hypha","hyphy","hypos","hyrax","hyson","hythe","iambi","iambs","ibrik","icers","iched","iches","ichor","icier","icker","ickle","icons","ictal","ictic","ictus","idant","ideas","idees","ident","idled","idles","idola","idols","idyls","iftar","igapo","igged","iglus","ihram","ikans","ikats","ikons","ileac","ileal","ileum","ileus","iliad","ilial","ilium","iller","illth","imago","imams","imari","imaum","imbar","imbed","imide","imido","imids","imine","imino","immew","immit","immix","imped","impis","impot","impro","imshi","imshy","inapt","inarm","inbye","incel","incle","incog","incus","incut","indew","india","indie","indol","indow","indri","indue","inerm","infix","infos","infra","ingan","ingle","inion","inked","inker","inkle","inned","innit","inorb","inrun","inset","inspo","intel","intil","intis","intra","inula","inure","inurn","inust","invar","inwit","iodic","iodid","iodin","iotas","ippon","irade","irids","iring","irked","iroko","irone","irons","isbas","ishes","isled","isles","isnae","issei","istle","items","ither","ivied","ivies","ixias","ixnay","ixora","ixtle","izard","izars","izzat","jaaps","jabot","jacal","jacks","jacky","jaded","jades","jafas","jaffa","jagas","jager","jaggs","jaggy","jagir","jagra","jails","jaker","jakes","jakey","jalap","jalop","jambe","jambo","jambs","jambu","james","jammy","jamon","janes","janns","janny","janty","japan","japed","japer","japes","jarks","jarls","jarps","jarta","jarul","jasey","jaspe","jasps","jatos","jauks","jaups","javas","javel","jawan","jawed","jaxie","jeans","jeats","jebel","jedis","jeels","jeely","jeeps","jeers","jeeze","jefes","jeffs","jehad","jehus","jelab","jello","jells","jembe","jemmy","jenny","jeons","jerid","jerks","jerry","jesse","jests","jesus","jetes","jeton","jeune","jewed","jewie","jhala","jiaos","jibba","jibbs","jibed","jiber","jibes","jiffs","jiggy","jigot","jihad","jills","jilts","jimmy","jimpy","jingo","jinks","jinne","jinni","jinns","jirds","jirga","jirre","jisms","jived","jiver","jives","jivey","jnana","jobed","jobes","jocko","jocks","jocky","jocos","jodel","joeys","johns","joins","joked","jokes","jokey","jokol","joled","joles","jolls","jolts","jolty","jomon","jomos","jones","jongs","jonty","jooks","joram","jorum","jotas","jotty","jotun","joual","jougs","jouks","joule","jours","jowar","jowed","jowls","jowly","joyed","jubas","jubes","jucos","judas","judgy","judos","jugal","jugum","jujus","juked","jukes","jukus","julep","jumar","jumby","jumps","junco","junks","junky","jupes","jupon","jural","jurat","jurel","jures","justs","jutes","jutty","juves","juvie","kaama","kabab","kabar","kabob","kacha","kacks","kadai","kades","kadis","kafir","kagos","kagus","kahal","kaiak","kaids","kaies","kaifs","kaika","kaiks","kails","kaims","kaing","kains","kakas","kakis","kalam","kales","kalif","kalis","kalpa","kamas","kames","kamik","kamis","kamme","kanae","kanas","kandy","kaneh","kanes","kanga","kangs","kanji","kants","kanzu","kaons","kapas","kaphs","kapok","kapow","kapus","kaput","karas","karat","karks","karns","karoo","karos","karri","karst","karsy","karts","karzy","kasha","kasme","katal","katas","katis","katti","kaugh","kauri","kauru","kaury","kaval","kavas","kawas","kawau","kawed","kayle","kayos","kazis","kazoo","kbars","kebar","kebob","kecks","kedge","kedgy","keech","keefs","keeks","keels","keema","keeno","keens","keeps","keets","keeve","kefir","kehua","keirs","kelep","kelim","kells","kelly","kelps","kelpy","kelts","kelty","kembo","kembs","kemps","kempt","kempy","kenaf","kench","kendo","kenos","kente","kents","kepis","kerbs","kerel","kerfs","kerky","kerma","kerne","kerns","keros","kerry","kerve","kesar","kests","ketas","ketch","ketes","ketol","kevel","kevil","kexes","keyed","keyer","khadi","khafs","khans","khaph","khats","khaya","khazi","kheda","kheth","khets","khoja","khors","khoum","khuds","kiaat","kiack","kiang","kibbe","kibbi","kibei","kibes","kibla","kicks","kicky","kiddo","kiddy","kidel","kidge","kiefs","kiers","kieve","kievs","kight","kikes","kikoi","kiley","kilim","kills","kilns","kilos","kilps","kilts","kilty","kimbo","kinas","kinda","kinds","kindy","kines","kings","kinin","kinks","kinos","kiore","kipes","kippa","kipps","kirby","kirks","kirns","kirri","kisan","kissy","kists","kited","kiter","kites","kithe","kiths","kitul","kivas","kiwis","klang","klaps","klett","klick","klieg","kliks","klong","kloof","kluge","klutz","knags","knaps","knarl","knars","knaur","knawe","knees","knell","knish","knits","knive","knobs","knops","knosp","knots","knout","knowe","knows","knubs","knurl","knurr","knurs","knuts","koans","koaps","koban","kobos","koels","koffs","kofta","kogal","kohas","kohen","kohls","koine","kojis","kokam","kokas","koker","kokra","kokum","kolas","kolos","kombu","konbu","kondo","konks","kooks","kooky","koori","kopek","kophs","kopje","koppa","korai","koras","korat","kores","korma","koros","korun","korus","koses","kotch","kotos","kotow","koura","kraal","krabs","kraft","krais","krait","krang","krans","kranz","kraut","krays","kreep","kreng","krewe","krona","krone","kroon","krubi","krunk","ksars","kubie","kudos","kudus","kudzu","kufis","kugel","kuias","kukri","kukus","kulak","kulan","kulas","kulfi","kumis","kumys","kuris","kurre","kurta","kurus","kusso","kutas","kutch","kutis","kutus","kuzus","kvass","kvell","kwela","kyack","kyaks","kyang","kyars","kyats","kybos","kydst","kyles","kylie","kylin","kylix","kyloe","kynde","kynds","kypes","kyrie","kytes","kythe","laari","labda","labia","labis","labra","laced","lacer","laces","lacet","lacey","lacks","laddy","laded","lader","lades","laers","laevo","lagan","lahal","lahar","laich","laics","laids","laigh","laika","laiks","laird","lairs","lairy","laith","laity","laked","laker","lakes","lakhs","lakin","laksa","laldy","lalls","lamas","lambs","lamby","lamed","lamer","lames","lamia","lammy","lamps","lanai","lanas","lanch","lande","lands","lanes","lanks","lants","lapin","lapis","lapje","larch","lards","lardy","laree","lares","largo","laris","larks","larky","larns","larnt","larum","lased","laser","lases","lassi","lassu","lassy","lasts","latah","lated","laten","latex","lathi","laths","lathy","latke","latus","lauan","lauch","lauds","laufs","laund","laura","laval","lavas","laved","laver","laves","lavra","lavvy","lawed","lawer","lawin","lawks","lawns","lawny","laxed","laxer","laxes","laxly","layed","layin","layup","lazar","lazed","lazes","lazos","lazzi","lazzo","leads","leady","leafs","leaks","leams","leans","leany","leaps","leare","lears","leary","leats","leavy","leaze","leben","leccy","ledes","ledgy","ledum","leear","leeks","leeps","leers","leese","leets","leeze","lefte","lefts","leger","leges","legge","leggo","legit","lehrs","lehua","leirs","leish","leman","lemed","lemel","lemes","lemma","lemme","lends","lenes","lengs","lenis","lenos","lense","lenti","lento","leone","lepid","lepra","lepta","lered","leres","lerps","lesbo","leses","lests","letch","lethe","letup","leuch","leuco","leuds","leugh","levas","levee","leves","levin","levis","lewis","lexes","lexis","lezes","lezza","lezzy","liana","liane","liang","liard","liars","liart","liber","libra","libri","lichi","licht","licit","licks","lidar","lidos","liefs","liens","liers","lieus","lieve","lifer","lifes","lifts","ligan","liger","ligge","ligne","liked","liker","likes","likin","lills","lilos","lilts","liman","limas","limax","limba","limbi","limbs","limby","limed","limen","limes","limey","limma","limns","limos","limpa","limps","linac","linch","linds","lindy","lined","lines","liney","linga","lings","lingy","linin","links","linky","linns","linny","linos","lints","linty","linum","linux","lions","lipas","lipes","lipin","lipos","lippy","liras","lirks","lirot","lisks","lisle","lisps","lists","litai","litas","lited","liter","lites","litho","liths","litre","lived","liven","lives","livor","livre","llano","loach","loads","loafs","loams","loans","loast","loave","lobar","lobed","lobes","lobos","lobus","loche","lochs","locie","locis","locks","locos","locum","loden","lodes","loess","lofts","logan","loges","loggy","logia","logie","logoi","logon","logos","lohan","loids","loins","loipe","loirs","lokes","lolls","lolly","lolog","lomas","lomed","lomes","loner","longa","longe","longs","looby","looed","looey","loofa","loofs","looie","looks","looky","looms","loons","loony","loops","loord","loots","loped","loper","lopes","loppy","loral","loran","lords","lordy","lorel","lores","loric","loris","losed","losel","losen","loses","lossy","lotah","lotas","lotes","lotic","lotos","lotsa","lotta","lotte","lotto","lotus","loued","lough","louie","louis","louma","lound","louns","loupe","loups","loure","lours","loury","louts","lovat","loved","loves","lovey","lovie","lowan","lowed","lowes","lownd","lowne","lowns","lowps","lowry","lowse","lowts","loxed","loxes","lozen","luach","luaus","lubed","lubes","lubra","luces","lucks","lucre","ludes","ludic","ludos","luffa","luffs","luged","luger","luges","lulls","lulus","lumas","lumbi","lumme","lummy","lumps","lunas","lunes","lunet","lungi","lungs","lunks","lunts","lupin","lured","lurer","lures","lurex","lurgi","lurgy","lurks","lurry","lurve","luser","lushy","lusks","lusts","lusus","lutea","luted","luter","lutes","luvvy","luxed","luxer","luxes","lweis","lyams","lyard","lyart","lyase","lycea","lycee","lycra","lymes","lynes","lyres","lysed","lyses","lysin","lysis","lysol","lyssa","lyted","lytes","lythe","lytic","lytta","maaed","maare","maars","mabes","macas","maced","macer","maces","mache","machi","machs","macks","macle","macon","madge","madid","madre","maerl","mafic","mages","maggs","magot","magus","mahoe","mahua","mahwa","maids","maiko","maiks","maile","maill","mails","maims","mains","maire","mairs","maise","maist","makar","makes","makis","makos","malam","malar","malas","malax","males","malic","malik","malis","malls","malms","malmy","malts","malty","malus","malva","malwa","mamas","mamba","mamee","mamey","mamie","manas","manat","mandi","maneb","maned","maneh","manes","manet","mangs","manis","manky","manna","manos","manse","manta","manto","manty","manul","manus","mapau","maqui","marae","marah","maras","marcs","mardy","mares","marge","margs","maria","marid","marka","marks","marle","marls","marly","marms","maron","maror","marra","marri","marse","marts","marvy","masas","mased","maser","mases","mashy","masks","massa","massy","masts","masty","masus","matai","mated","mater","mates","maths","matin","matlo","matte","matts","matza","matzo","mauby","mauds","mauls","maund","mauri","mausy","mauts","mauzy","maven","mavie","mavin","mavis","mawed","mawks","mawky","mawns","mawrs","maxed","maxes","maxis","mayan","mayas","mayed","mayos","mayst","mazed","mazer","mazes","mazey","mazut","mbira","meads","meals","meane","means","meany","meare","mease","meath","meats","mebos","mechs","mecks","medii","medle","meeds","meers","meets","meffs","meins","meint","meiny","meith","mekka","melas","melba","melds","melic","melik","mells","melts","melty","memes","memos","menad","mends","mened","menes","menge","mengs","mensa","mense","mensh","menta","mento","menus","meous","meows","merch","mercs","merde","mered","merel","merer","meres","meril","meris","merks","merle","merls","merse","mesal","mesas","mesel","meses","meshy","mesic","mesne","meson","messy","mesto","meted","metes","metho","meths","metic","metif","metis","metol","metre","meuse","meved","meves","mewed","mewls","meynt","mezes","mezze","mezzo","mhorr","miaou","miaow","miasm","miaul","micas","miche","micht","micks","micky","micos","micra","middy","midgy","midis","miens","mieve","miffs","miffy","mifty","miggs","mihas","mihis","miked","mikes","mikra","mikva","milch","milds","miler","miles","milfs","milia","milko","milks","mille","mills","milor","milos","milpa","milts","milty","miltz","mimed","mimeo","mimer","mimes","mimsy","minae","minar","minas","mincy","minds","mined","mines","minge","mings","mingy","minis","minke","minks","minny","minos","mints","mired","mires","mirex","mirid","mirin","mirks","mirky","mirly","miros","mirvs","mirza","misch","misdo","mises","misgo","misos","missa","mists","misty","mitch","miter","mites","mitis","mitre","mitts","mixed","mixen","mixer","mixes","mixte","mixup","mizen","mizzy","mneme","moans","moats","mobby","mobes","mobey","mobie","moble","mochi","mochs","mochy","mocks","moder","modes","modge","modii","modus","moers","mofos","moggy","mohel","mohos","mohrs","mohua","mohur","moile","moils","moira","moire","moits","mojos","mokes","mokis","mokos","molal","molas","molds","moled","moles","molla","molls","molly","molto","molts","molys","momes","momma","mommy","momus","monad","monal","monas","monde","mondo","moner","mongo","mongs","monic","monie","monks","monos","monte","monty","moobs","mooch","moods","mooed","mooks","moola","mooli","mools","mooly","moong","moons","moony","moops","moors","moory","moots","moove","moped","moper","mopes","mopey","moppy","mopsy","mopus","morae","moras","morat","moray","morel","mores","moria","morne","morns","morra","morro","morse","morts","mosed","moses","mosey","mosks","mosso","moste","mosts","moted","moten","motes","motet","motey","moths","mothy","motis","motte","motts","motty","motus","motza","mouch","moues","mould","mouls","moups","moust","mousy","moved","moves","mowas","mowed","mowra","moxas","moxie","moyas","moyle","moyls","mozed","mozes","mozos","mpret","mucho","mucic","mucid","mucin","mucks","mucor","mucro","mudge","mudir","mudra","muffs","mufti","mugga","muggs","muggy","muhly","muids","muils","muirs","muist","mujik","mulct","muled","mules","muley","mulga","mulie","mulla","mulls","mulse","mulsh","mumms","mumps","mumsy","mumus","munga","munge","mungo","mungs","munis","munts","muntu","muons","muras","mured","mures","murex","murid","murks","murls","murly","murra","murre","murri","murrs","murry","murti","murva","musar","musca","mused","muser","muses","muset","musha","musit","musks","musos","musse","mussy","musth","musts","mutch","muted","muter","mutes","mutha","mutis","muton","mutts","muxed","muxes","muzak","muzzy","mvule","myall","mylar","mynah","mynas","myoid","myoma","myope","myops","myopy","mysid","mythi","myths","mythy","myxos","mzees","naams","naans","nabes","nabis","nabks","nabla","nabob","nache","nacho","nacre","nadas","naeve","naevi","naffs","nagas","naggy","nagor","nahal","naiad","naifs","naiks","nails","naira","nairu","naked","naker","nakfa","nalas","naled","nalla","named","namer","names","namma","namus","nanas","nance","nancy","nandu","nanna","nanos","nanua","napas","naped","napes","napoo","nappa","nappe","nappy","naras","narco","narcs","nards","nares","naric","naris","narks","narky","narre","nashi","natch","nates","natis","natty","nauch","naunt","navar","naves","navew","navvy","nawab","nazes","nazir","nazis","nduja","neafe","neals","neaps","nears","neath","neats","nebek","nebel","necks","neddy","needs","neeld","neele","neemb","neems","neeps","neese","neeze","negro","negus","neifs","neist","neive","nelis","nelly","nemas","nemns","nempt","nenes","neons","neper","nepit","neral","nerds","nerka","nerks","nerol","nerts","nertz","nervy","nests","netes","netop","netts","netty","neuks","neume","neums","nevel","neves","nevus","newbs","newed","newel","newie","newsy","newts","nexts","nexus","ngaio","ngana","ngati","ngoma","ngwee","nicad","nicht","nicks","nicol","nidal","nided","nides","nidor","nidus","niefs","nieve","nifes","niffs","niffy","nifty","niger","nighs","nihil","nikab","nikah","nikau","nills","nimbi","nimbs","nimps","niner","nines","ninon","nipas","nippy","niqab","nirls","nirly","nisei","nisse","nisus","niter","nites","nitid","niton","nitre","nitro","nitry","nitty","nival","nixed","nixer","nixes","nixie","nizam","nkosi","noahs","nobby","nocks","nodal","noddy","nodes","nodus","noels","noggs","nohow","noils","noily","noint","noirs","noles","nolls","nolos","nomas","nomen","nomes","nomic","nomoi","nomos","nonas","nonce","nones","nonet","nongs","nonis","nonny","nonyl","noobs","nooit","nooks","nooky","noons","noops","nopal","noria","noris","norks","norma","norms","nosed","noser","noses","notal","noted","noter","notes","notum","nould","noule","nouls","nouns","nouny","noups","novae","novas","novum","noway","nowed","nowls","nowts","nowty","noxal","noxes","noyau","noyed","noyes","nubby","nubia","nucha","nuddy","nuder","nudes","nudie","nudzh","nuffs","nugae","nuked","nukes","nulla","nulls","numbs","numen","nummy","nunny","nurds","nurdy","nurls","nurrs","nutso","nutsy","nyaff","nyala","nying","nyssa","oaked","oaker","oakum","oared","oases","oasis","oasts","oaten","oater","oaths","oaves","obang","obeah","obeli","obeys","obias","obied","obiit","obits","objet","oboes","obole","oboli","obols","occam","ocher","oches","ochre","ochry","ocker","ocrea","octad","octan","octas","octyl","oculi","odahs","odals","odeon","odeum","odism","odist","odium","odors","odour","odyle","odyls","ofays","offed","offie","oflag","ofter","ogams","ogeed","ogees","oggin","ogham","ogive","ogled","ogler","ogles","ogmic","ogres","ohias","ohing","ohmic","ohone","oidia","oiled","oiler","oinks","oints","ojime","okapi","okays","okehs","okras","oktas","oldie","oleic","olein","olent","oleos","oleum","olios","ollas","ollav","oller","ollie","ology","olpae","olpes","omasa","omber","ombus","omens","omers","omits","omlah","omovs","omrah","oncer","onces","oncet","oncus","onely","oners","onery","onium","onkus","onlay","onned","ontic","oobit","oohed","oomph","oonts","ooped","oorie","ooses","ootid","oozed","oozes","opahs","opals","opens","opepe","oping","oppos","opsin","opted","opter","orach","oracy","orals","orang","orant","orate","orbed","orcas","orcin","ordos","oread","orfes","orgia","orgic","orgue","oribi","oriel","orixa","orles","orlon","orlop","ormer","ornis","orpin","orris","ortho","orval","orzos","oscar","oshac","osier","osmic","osmol","ossia","ostia","otaku","otary","ottar","ottos","oubit","oucht","ouens","ouija","oulks","oumas","oundy","oupas","ouped","ouphe","ouphs","ourie","ousel","ousts","outby","outed","outre","outro","outta","ouzel","ouzos","ovals","ovels","ovens","overs","ovist","ovoli","ovolo","ovule","owche","owies","owled","owler","owlet","owned","owres","owrie","owsen","oxbow","oxers","oxeye","oxids","oxies","oxime","oxims","oxlip","oxter","oyers","ozeki","ozzie","paals","paans","pacas","paced","pacer","paces","pacey","pacha","packs","pacos","pacta","pacts","padis","padle","padma","padre","padri","paean","paedo","paeon","paged","pager","pages","pagle","pagod","pagri","paiks","pails","pains","paire","pairs","paisa","paise","pakka","palas","palay","palea","paled","pales","palet","palis","palki","palla","palls","pally","palms","palmy","palpi","palps","palsa","pampa","panax","pance","panda","pands","pandy","paned","panes","panga","pangs","panim","panko","panne","panni","panto","pants","panty","paoli","paolo","papas","papaw","papes","pappi","pappy","parae","paras","parch","pardi","pards","pardy","pared","paren","pareo","pares","pareu","parev","parge","pargo","paris","parki","parks","parky","parle","parly","parma","parol","parps","parra","parrs","parti","parts","parve","parvo","paseo","pases","pasha","pashm","paska","paspy","passe","pasts","pated","paten","pater","pates","paths","patin","patka","patly","patte","patus","pauas","pauls","pavan","paved","paven","paver","paves","pavid","pavin","pavis","pawas","pawaw","pawed","pawer","pawks","pawky","pawls","pawns","paxes","payed","payor","paysd","peage","peags","peaks","peaky","peals","peans","peare","pears","peart","pease","peats","peaty","peavy","peaze","pebas","pechs","pecke","pecks","pecky","pedes","pedis","pedro","peece","peeks","peels","peens","peeoy","peepe","peeps","peers","peery","peeve","peggy","peghs","peins","peise","peize","pekan","pekes","pekin","pekoe","pelas","pelau","peles","pelfs","pells","pelma","pelon","pelta","pelts","pends","pendu","pened","penes","pengo","penie","penis","penks","penna","penni","pents","peons","peony","pepla","pepos","peppy","pepsi","perai","perce","percs","perdu","perdy","perea","peres","peris","perks","perms","perns","perog","perps","perry","perse","perst","perts","perve","pervo","pervs","pervy","pesos","pests","pesty","petar","peter","petit","petre","petri","petti","petto","pewee","pewit","peyse","phage","phang","phare","pharm","pheer","phene","pheon","phese","phial","phish","phizz","phlox","phoca","phono","phons","phots","phpht","phuts","phyla","phyle","piani","pians","pibal","pical","picas","piccy","picks","picot","picra","picul","piend","piers","piert","pieta","piets","piezo","pight","pigmy","piing","pikas","pikau","piked","piker","pikes","pikey","pikis","pikul","pilae","pilaf","pilao","pilar","pilau","pilaw","pilch","pilea","piled","pilei","piler","piles","pilis","pills","pilow","pilum","pilus","pimas","pimps","pinas","pined","pines","pingo","pings","pinko","pinks","pinna","pinny","pinon","pinot","pinta","pints","pinup","pions","piony","pious","pioye","pioys","pipal","pipas","piped","pipes","pipet","pipis","pipit","pippy","pipul","pirai","pirls","pirns","pirog","pisco","pises","pisky","pisos","pissy","piste","pitas","piths","piton","pitot","pitta","piums","pixes","pized","pizes","plaas","plack","plage","plans","plaps","plash","plasm","plast","plats","platt","platy","playa","plays","pleas","plebe","plebs","plena","pleon","plesh","plews","plica","plies","plims","pling","plink","ploat","plods","plong","plonk","plook","plops","plots","plotz","plouk","plows","ploye","ploys","plues","pluff","plugs","plums","plumy","pluot","pluto","plyer","poach","poaka","poake","poboy","pocks","pocky","podal","poddy","podex","podge","podgy","podia","poems","poeps","poets","pogey","pogge","pogos","pohed","poilu","poind","pokal","poked","pokes","pokey","pokie","poled","poler","poles","poley","polio","polis","polje","polks","polls","polly","polos","polts","polys","pombe","pomes","pommy","pomos","pomps","ponce","poncy","ponds","pones","poney","ponga","pongo","pongs","pongy","ponks","ponts","ponty","ponzu","poods","pooed","poofs","poofy","poohs","pooja","pooka","pooks","pools","poons","poops","poopy","poori","poort","poots","poove","poovy","popes","poppa","popsy","porae","poral","pored","porer","pores","porge","porgy","porin","porks","porky","porno","porns","porny","porta","ports","porty","posed","poses","posey","posho","posts","potae","potch","poted","potes","potin","potoo","potsy","potto","potts","potty","pouff","poufs","pouke","pouks","poule","poulp","poult","poupe","poupt","pours","pouts","powan","powin","pownd","powns","powny","powre","poxed","poxes","poynt","poyou","poyse","pozzy","praam","prads","prahu","prams","prana","prang","praos","prase","prate","prats","pratt","praty","praus","prays","predy","preed","prees","preif","prems","premy","prent","preon","preop","preps","presa","prese","prest","preve","prexy","preys","prial","pricy","prief","prier","pries","prigs","prill","prima","primi","primp","prims","primy","prink","prion","prise","priss","proas","probs","prods","proem","profs","progs","proin","proke","prole","proll","promo","proms","pronk","props","prore","proso","pross","prost","prosy","proto","proul","prows","proyn","prunt","pruta","pryer","pryse","pseud","pshaw","psion","psoae","psoai","psoas","psora","psych","psyop","pubco","pubes","pubis","pucan","pucer","puces","pucka","pucks","puddy","pudge","pudic","pudor","pudsy","pudus","puers","puffa","puffs","puggy","pugil","puhas","pujah","pujas","pukas","puked","puker","pukes","pukey","pukka","pukus","pulao","pulas","puled","puler","pules","pulik","pulis","pulka","pulks","pulli","pulls","pully","pulmo","pulps","pulus","pumas","pumie","pumps","punas","punce","punga","pungs","punji","punka","punks","punky","punny","punto","punts","punty","pupae","pupas","pupus","purda","pured","pures","purin","puris","purls","purpy","purrs","pursy","purty","puses","pusle","pussy","putid","puton","putti","putto","putts","puzel","pwned","pyats","pyets","pygal","pyins","pylon","pyned","pynes","pyoid","pyots","pyral","pyran","pyres","pyrex","pyric","pyros","pyxed","pyxes","pyxie","pyxis","pzazz","qadis","qaids","qajaq","qanat","qapik","qibla","qophs","qorma","quads","quaff","quags","quair","quais","quaky","quale","quant","quare","quass","quate","quats","quayd","quays","qubit","quean","queme","quena","quern","queyn","queys","quich","quids","quiff","quims","quina","quine","quino","quins","quint","quipo","quips","quipu","quire","quirt","quist","quits","quoad","quods","quoif","quoin","quoit","quoll","quonk","quops","qursh","quyte","rabat","rabic","rabis","raced","races","rache","racks","racon","radge","radix","radon","raffs","rafts","ragas","ragde","raged","ragee","rager","rages","ragga","raggs","raggy","ragis","ragus","rahed","rahui","raias","raids","raiks","raile","rails","raine","rains","raird","raita","raits","rajas","rajes","raked","rakee","raker","rakes","rakia","rakis","rakus","rales","ramal","ramee","ramet","ramie","ramin","ramis","rammy","ramps","ramus","ranas","rance","rands","ranee","ranga","rangi","rangs","rangy","ranid","ranis","ranke","ranks","rants","raped","raper","rapes","raphe","rappe","rared","raree","rares","rarks","rased","raser","rases","rasps","rasse","rasta","ratal","ratan","ratas","ratch","rated","ratel","rater","rates","ratha","rathe","raths","ratoo","ratos","ratus","rauns","raupo","raved","ravel","raver","raves","ravey","ravin","rawer","rawin","rawly","rawns","raxed","raxes","rayah","rayas","rayed","rayle","rayne","razed","razee","razer","razes","razoo","readd","reads","reais","reaks","realo","reals","reame","reams","reamy","reans","reaps","rears","reast","reata","reate","reave","rebbe","rebec","rebid","rebit","rebop","rebuy","recal","recce","recco","reccy","recit","recks","recon","recta","recti","recto","redan","redds","reddy","reded","redes","redia","redid","redip","redly","redon","redos","redox","redry","redub","redux","redye","reech","reede","reeds","reefs","reefy","reeks","reeky","reels","reens","reest","reeve","refed","refel","reffo","refis","refix","refly","refry","regar","reges","reggo","regie","regma","regna","regos","regur","rehem","reifs","reify","reiki","reiks","reink","reins","reird","reist","reive","rejig","rejon","reked","rekes","rekey","relet","relie","relit","rello","reman","remap","remen","remet","remex","remix","renay","rends","reney","renga","renig","renin","renne","renos","rente","rents","reoil","reorg","repeg","repin","repla","repos","repot","repps","repro","reran","rerig","resat","resaw","resay","resee","reses","resew","resid","resit","resod","resow","resto","rests","resty","resus","retag","retax","retem","retia","retie","retox","revet","revie","rewan","rewax","rewed","rewet","rewin","rewon","rewth","rexes","rezes","rheas","rheme","rheum","rhies","rhime","rhine","rhody","rhomb","rhone","rhumb","rhyne","rhyta","riads","rials","riant","riata","ribas","ribby","ribes","riced","ricer","rices","ricey","richt","ricin","ricks","rides","ridgy","ridic","riels","riems","rieve","rifer","riffs","rifte","rifts","rifty","riggs","rigol","riled","riles","riley","rille","rills","rimae","rimed","rimer","rimes","rimus","rinds","rindy","rines","rings","rinks","rioja","riots","riped","ripes","ripps","rises","rishi","risks","risps","risus","rites","ritts","ritzy","rivas","rived","rivel","riven","rives","riyal","rizas","roads","roams","roans","roars","roary","roate","robed","robes","roble","rocks","roded","rodes","roguy","rohes","roids","roils","roily","roins","roist","rojak","rojis","roked","roker","rokes","rolag","roles","rolfs","rolls","romal","roman","romeo","romps","ronde","rondo","roneo","rones","ronin","ronne","ronte","ronts","roods","roofs","roofy","rooks","rooky","rooms","roons","roops","roopy","roosa","roose","roots","rooty","roped","roper","ropes","ropey","roque","roral","rores","roric","rorid","rorie","rorts","rorty","rosed","roses","roset","roshi","rosin","rosit","rosti","rosts","rotal","rotan","rotas","rotch","roted","rotes","rotis","rotls","roton","rotos","rotte","rouen","roues","roule","rouls","roums","roups","roupy","roust","routh","routs","roved","roven","roves","rowan","rowed","rowel","rowen","rowie","rowme","rownd","rowth","rowts","royne","royst","rozet","rozit","ruana","rubai","rubby","rubel","rubes","rubin","ruble","rubli","rubus","ruche","rucks","rudas","rudds","rudes","rudie","rudis","rueda","ruers","ruffe","ruffs","rugae","rugal","ruggy","ruing","ruins","rukhs","ruled","rules","rumal","rumbo","rumen","rumes","rumly","rummy","rumpo","rumps","rumpy","runch","runds","runed","runes","rungs","runic","runny","runts","runty","rupia","rurps","rurus","rusas","ruses","rushy","rusks","rusma","russe","rusts","ruths","rutin","rutty","ryals","rybat","ryked","rykes","rymme","rynds","ryots","ryper","saags","sabal","sabed","saber","sabes","sabha","sabin","sabir","sable","sabot","sabra","sabre","sacks","sacra","saddo","sades","sadhe","sadhu","sadis","sados","sadza","safed","safes","sagas","sager","sages","saggy","sagos","sagum","saheb","sahib","saice","saick","saics","saids","saiga","sails","saims","saine","sains","sairs","saist","saith","sajou","sakai","saker","sakes","sakia","sakis","sakti","salal","salat","salep","sales","salet","salic","salix","salle","salmi","salol","salop","salpa","salps","salse","salto","salts","salue","salut","saman","samas","samba","sambo","samek","samel","samen","sames","samey","samfu","sammy","sampi","samps","sands","saned","sanes","sanga","sangh","sango","sangs","sanko","sansa","santo","sants","saola","sapan","sapid","sapor","saran","sards","sared","saree","sarge","sargo","sarin","saris","sarks","sarky","sarod","saros","sarus","saser","sasin","sasse","satai","satay","sated","satem","sates","satis","sauba","sauch","saugh","sauls","sault","saunt","saury","sauts","saved","saver","saves","savey","savin","sawah","sawed","sawer","saxes","sayed","sayer","sayid","sayne","sayon","sayst","sazes","scabs","scads","scaff","scags","scail","scala","scall","scams","scand","scans","scapa","scape","scapi","scarp","scars","scart","scath","scats","scatt","scaud","scaup","scaur","scaws","sceat","scena","scend","schav","schmo","schul","schwa","sclim","scody","scogs","scoog","scoot","scopa","scops","scots","scoug","scoup","scowp","scows","scrab","scrae","scrag","scran","scrat","scraw","scray","scrim","scrip","scrob","scrod","scrog","scrow","scudi","scudo","scuds","scuff","scuft","scugs","sculk","scull","sculp","sculs","scums","scups","scurf","scurs","scuse","scuta","scute","scuts","scuzz","scyes","sdayn","sdein","seals","seame","seams","seamy","seans","seare","sears","sease","seats","seaze","sebum","secco","sechs","sects","seder","sedes","sedge","sedgy","sedum","seeds","seeks","seeld","seels","seely","seems","seeps","seepy","seers","sefer","segar","segni","segno","segol","segos","sehri","seifs","seils","seine","seirs","seise","seism","seity","seiza","sekos","sekts","selah","seles","selfs","sella","selle","sells","selva","semee","semes","semie","semis","senas","sends","senes","sengi","senna","senor","sensa","sensi","sente","senti","sents","senvy","senza","sepad","sepal","sepic","sepoy","septa","septs","serac","serai","seral","sered","serer","seres","serfs","serge","seric","serin","serks","seron","serow","serra","serre","serrs","serry","servo","sesey","sessa","setae","setal","seton","setts","sewan","sewar","sewed","sewel","sewen","sewin","sexed","sexer","sexes","sexto","sexts","seyen","shads","shags","shahs","shako","shakt","shalm","shaly","shama","shams","shand","shans","shaps","sharn","shash","shaul","shawm","shawn","shaws","shaya","shays","shchi","sheaf","sheal","sheas","sheds","sheel","shend","shent","sheol","sherd","shere","shero","shets","sheva","shewn","shews","shiai","shiel","shier","shies","shill","shily","shims","shins","ships","shirr","shirs","shish","shiso","shist","shite","shits","shiur","shiva","shive","shivs","shlep","shlub","shmek","shmoe","shoat","shoed","shoer","shoes","shogi","shogs","shoji","shojo","shola","shool","shoon","shoos","shope","shops","shorl","shote","shots","shott","showd","shows","shoyu","shred","shris","shrow","shtik","shtum","shtup","shule","shuln","shuls","shuns","shura","shute","shuts","shwas","shyer","sials","sibbs","sibyl","sices","sicht","sicko","sicks","sicky","sidas","sided","sider","sides","sidha","sidhe","sidle","sield","siens","sient","sieth","sieur","sifts","sighs","sigil","sigla","signa","signs","sijos","sikas","siker","sikes","silds","siled","silen","siler","siles","silex","silks","sills","silos","silts","silty","silva","simar","simas","simba","simis","simps","simul","sinds","sined","sines","sings","sinhs","sinks","sinky","sinus","siped","sipes","sippy","sired","siree","sires","sirih","siris","siroc","sirra","sirup","sisal","sises","sista","sists","sitar","sited","sites","sithe","sitka","situp","situs","siver","sixer","sixes","sixmo","sixte","sizar","sized","sizel","sizer","sizes","skags","skail","skald","skank","skart","skats","skatt","skaws","skean","skear","skeds","skeed","skeef","skeen","skeer","skees","skeet","skegg","skegs","skein","skelf","skell","skelm","skelp","skene","skens","skeos","skeps","skers","skets","skews","skids","skied","skies","skiey","skimo","skims","skink","skins","skint","skios","skips","skirl","skirr","skite","skits","skive","skivy","sklim","skoal","skody","skoff","skogs","skols","skool","skort","skosh","skran","skrik","skuas","skugs","skyed","skyer","skyey","skyfs","skyre","skyrs","skyte","slabs","slade","slaes","slags","slaid","slake","slams","slane","slank","slaps","slart","slats","slaty","slaws","slays","slebs","sleds","sleer","slews","sleys","slier","slily","slims","slipe","slips","slipt","slish","slits","slive","sloan","slobs","sloes","slogs","sloid","slojd","slomo","sloom","sloot","slops","slopy","slorm","slots","slove","slows","sloyd","slubb","slubs","slued","slues","sluff","slugs","sluit","slums","slurb","slurs","sluse","sluts","slyer","slype","smaak","smaik","smalm","smalt","smarm","smaze","smeek","smees","smeik","smeke","smerk","smews","smirr","smirs","smits","smogs","smoko","smolt","smoor","smoot","smore","smorg","smout","smowt","smugs","smurs","smush","smuts","snabs","snafu","snags","snaps","snarf","snark","snars","snary","snash","snath","snaws","snead","sneap","snebs","sneck","sneds","sneed","snees","snell","snibs","snick","snies","snift","snigs","snips","snipy","snirt","snits","snobs","snods","snoek","snoep","snogs","snoke","snood","snook","snool","snoot","snots","snowk","snows","snubs","snugs","snush","snyes","soaks","soaps","soare","soars","soave","sobas","socas","soces","socko","socks","socle","sodas","soddy","sodic","sodom","sofar","sofas","softa","softs","softy","soger","sohur","soils","soily","sojas","sojus","sokah","soken","sokes","sokol","solah","solan","solas","solde","soldi","soldo","solds","soled","solei","soler","soles","solon","solos","solum","solus","soman","somas","sonce","sonde","sones","songs","sonly","sonne","sonny","sonse","sonsy","sooey","sooks","sooky","soole","sools","sooms","soops","soote","soots","sophs","sophy","sopor","soppy","sopra","soral","soras","sorbo","sorbs","sorda","sordo","sords","sored","soree","sorel","sorer","sores","sorex","sorgo","sorns","sorra","sorta","sorts","sorus","soths","sotol","souce","souct","sough","souks","souls","soums","soups","soupy","sours","souse","souts","sowar","sowce","sowed","sowff","sowfs","sowle","sowls","sowms","sownd","sowne","sowps","sowse","sowth","soyas","soyle","soyuz","sozin","spacy","spado","spaed","spaer","spaes","spags","spahi","spail","spain","spait","spake","spald","spale","spall","spalt","spams","spane","spang","spans","spard","spars","spart","spate","spats","spaul","spawl","spaws","spayd","spays","spaza","spazz","speal","spean","speat","specs","spect","speel","speer","speil","speir","speks","speld","spelk","speos","spets","speug","spews","spewy","spial","spica","spick","spics","spide","spier","spies","spiff","spifs","spiks","spile","spims","spina","spink","spins","spirt","spiry","spits","spitz","spivs","splay","splog","spode","spods","spoom","spoor","spoot","spork","sposh","spots","sprad","sprag","sprat","spred","sprew","sprit","sprod","sprog","sprue","sprug","spuds","spued","spuer","spues","spugs","spule","spume","spumy","spurs","sputa","spyal","spyre","squab","squaw","squeg","squid","squit","squiz","stabs","stade","stags","stagy","staig","stane","stang","staph","staps","starn","starr","stars","stats","staun","staws","stays","stean","stear","stedd","stede","steds","steek","steem","steen","steil","stela","stele","stell","steme","stems","stend","steno","stens","stent","steps","stept","stere","stets","stews","stewy","steys","stich","stied","sties","stilb","stile","stime","stims","stimy","stipa","stipe","stire","stirk","stirp","stirs","stive","stivy","stoae","stoai","stoas","stoat","stobs","stoep","stogy","stoit","stoln","stoma","stond","stong","stonk","stonn","stook","stoor","stope","stops","stopt","stoss","stots","stott","stoun","stoup","stour","stown","stowp","stows","strad","strae","strag","strak","strep","strew","stria","strig","strim","strop","strow","stroy","strum","stubs","stude","studs","stull","stulm","stumm","stums","stuns","stupa","stupe","sture","sturt","styed","styes","styli","stylo","styme","stymy","styre","styte","subah","subas","subby","suber","subha","succi","sucks","sucky","sucre","sudds","sudor","sudsy","suede","suent","suers","suete","suets","suety","sugan","sughs","sugos","suhur","suids","suint","suits","sujee","sukhs","sukuk","sulci","sulfa","sulfo","sulks","sulph","sulus","sumis","summa","sumos","sumph","sumps","sunis","sunks","sunna","sunns","sunup","supes","supra","surah","sural","suras","surat","surds","sured","sures","surfs","surfy","surgy","surra","sused","suses","susus","sutor","sutra","sutta","swabs","swack","swads","swage","swags","swail","swain","swale","swaly","swamy","swang","swank","swans","swaps","swapt","sward","sware","swarf","swart","swats","swayl","sways","sweal","swede","sweed","sweel","sweer","swees","sweir","swelt","swerf","sweys","swies","swigs","swile","swims","swink","swipe","swire","swiss","swith","swits","swive","swizz","swobs","swole","swoln","swops","swopt","swots","swoun","sybbe","sybil","syboe","sybow","sycee","syces","sycon","syens","syker","sykes","sylis","sylph","sylva","symar","synch","syncs","synds","syned","synes","synth","syped","sypes","syphs","syrah","syren","sysop","sythe","syver","taals","taata","taber","tabes","tabid","tabis","tabla","tabor","tabun","tabus","tacan","taces","tacet","tache","tacho","tachs","tacks","tacos","tacts","taels","tafia","taggy","tagma","tahas","tahrs","taiga","taigs","taiko","tails","tains","taira","taish","taits","tajes","takas","takes","takhi","takin","takis","takky","talak","talaq","talar","talas","talcs","talcy","talea","taler","tales","talks","talky","talls","talma","talpa","taluk","talus","tamal","tamed","tames","tamin","tamis","tammy","tamps","tanas","tanga","tangi","tangs","tanhs","tanka","tanks","tanky","tanna","tansy","tanti","tanto","tanty","tapas","taped","tapen","tapes","tapet","tapis","tappa","tapus","taras","tardo","tared","tares","targa","targe","tarns","taroc","tarok","taros","tarps","tarre","tarry","tarsi","tarts","tarty","tasar","tased","taser","tases","tasks","tassa","tasse","tasso","tatar","tater","tates","taths","tatie","tatou","tatts","tatus","taube","tauld","tauon","taupe","tauts","tavah","tavas","taver","tawai","tawas","tawed","tawer","tawie","tawse","tawts","taxed","taxer","taxes","taxis","taxol","taxon","taxor","taxus","tayra","tazza","tazze","teade","teads","teaed","teaks","teals","teams","tears","teats","teaze","techs","techy","tecta","teels","teems","teend","teene","teens","teeny","teers","teffs","teggs","tegua","tegus","tehrs","teiid","teils","teind","teins","telae","telco","teles","telex","telia","telic","tells","telly","teloi","telos","temed","temes","tempi","temps","tempt","temse","tench","tends","tendu","tenes","tenge","tenia","tenne","tenno","tenny","tenon","tents","tenty","tenue","tepal","tepas","tepoy","terai","teras","terce","terek","teres","terfe","terfs","terga","terms","terne","terns","terry","terts","tesla","testa","teste","tests","tetes","teths","tetra","tetri","teuch","teugh","tewed","tewel","tewit","texas","texes","texts","thack","thagi","thaim","thale","thali","thana","thane","thang","thans","thanx","tharm","thars","thaws","thawy","thebe","theca","theed","theek","thees","thegn","theic","thein","thelf","thema","thens","theow","therm","thesp","thete","thews","thewy","thigs","thilk","thill","thine","thins","thiol","thirl","thoft","thole","tholi","thoro","thorp","thous","thowl","thrae","thraw","thrid","thrip","throe","thuds","thugs","thuja","thunk","thurl","thuya","thymi","thymy","tians","tiars","tical","ticca","ticed","tices","tichy","ticks","ticky","tiddy","tided","tides","tiers","tiffs","tifos","tifts","tiges","tigon","tikas","tikes","tikis","tikka","tilak","tiled","tiler","tiles","tills","tilly","tilth","tilts","timbo","timed","times","timon","timps","tinas","tinct","tinds","tinea","tined","tines","tinge","tings","tinks","tinny","tints","tinty","tipis","tippy","tired","tires","tirls","tiros","tirrs","titch","titer","titis","titre","titty","titup","tiyin","tiyns","tizes","tizzy","toads","toady","toaze","tocks","tocky","tocos","todde","toeas","toffs","toffy","tofts","tofus","togae","togas","toged","toges","togue","tohos","toile","toils","toing","toise","toits","tokay","toked","toker","tokes","tokos","tolan","tolar","tolas","toled","toles","tolls","tolly","tolts","tolus","tolyl","toman","tombs","tomes","tomia","tommy","tomos","tondi","tondo","toned","toner","tones","toney","tongs","tonka","tonks","tonne","tonus","tools","tooms","toons","toots","toped","topee","topek","toper","topes","tophe","tophi","tophs","topis","topoi","topos","toppy","toque","torah","toran","toras","torcs","tores","toric","torii","toros","torot","torrs","torse","torsi","torsk","torta","torte","torts","tosas","tosed","toses","toshy","tossy","toted","toter","totes","totty","touks","touns","tours","touse","tousy","touts","touze","touzy","towed","towie","towns","towny","towse","towsy","towts","towze","towzy","toyed","toyer","toyon","toyos","tozed","tozes","tozie","trabs","trads","tragi","traik","trams","trank","tranq","trans","trant","trape","traps","trapt","trass","trats","tratt","trave","trayf","trays","treck","treed","treen","trees","trefa","treif","treks","trema","trems","tress","trest","trets","trews","treyf","treys","triac","tride","trier","tries","triff","trigo","trigs","trike","trild","trill","trims","trine","trins","triol","trior","trios","trips","tripy","trist","troad","troak","troat","trock","trode","trods","trogs","trois","troke","tromp","trona","tronc","trone","tronk","trons","trooz","troth","trots","trows","troys","trued","trues","trugo","trugs","trull","tryer","tryke","tryma","tryps","tsade","tsadi","tsars","tsked","tsuba","tsubo","tuans","tuart","tuath","tubae","tubar","tubas","tubby","tubed","tubes","tucks","tufas","tuffe","tuffs","tufts","tufty","tugra","tuile","tuina","tuism","tuktu","tules","tulpa","tulsi","tumid","tummy","tumps","tumpy","tunas","tunds","tuned","tuner","tunes","tungs","tunny","tupek","tupik","tuple","tuque","turds","turfs","turfy","turks","turme","turms","turns","turnt","turps","turrs","tushy","tusks","tusky","tutee","tutti","tutty","tutus","tuxes","tuyer","twaes","twain","twals","twank","twats","tways","tweel","tween","tweep","tweer","twerk","twerp","twier","twigs","twill","twilt","twink","twins","twiny","twire","twirp","twite","twits","twoer","twyer","tyees","tyers","tyiyn","tykes","tyler","tymps","tynde","tyned","tynes","typal","typed","types","typey","typic","typos","typps","typto","tyran","tyred","tyres","tyros","tythe","tzars","udals","udons","ugali","ugged","uhlan","uhuru","ukase","ulama","ulans","ulema","ulmin","ulnad","ulnae","ulnar","ulnas","ulpan","ulvas","ulyie","ulzie","umami","umbel","umber","umble","umbos","umbre","umiac","umiak","umiaq","ummah","ummas","ummed","umped","umphs","umpie","umpty","umrah","umras","unais","unapt","unarm","unary","unaus","unbag","unban","unbar","unbed","unbid","unbox","uncap","unces","uncia","uncos","uncoy","uncus","undam","undee","undos","undug","uneth","unfix","ungag","unget","ungod","ungot","ungum","unhat","unhip","unica","units","unjam","unked","unket","unkid","unlaw","unlay","unled","unlet","unlid","unman","unmew","unmix","unpay","unpeg","unpen","unpin","unred","unrid","unrig","unrip","unsaw","unsay","unsee","unsew","unsex","unsod","untax","untin","unwet","unwit","unwon","upbow","upbye","updos","updry","upend","upjet","uplay","upled","uplit","upped","upran","uprun","upsee","upsey","uptak","upter","uptie","uraei","urali","uraos","urare","urari","urase","urate","urbex","urbia","urdee","ureal","ureas","uredo","ureic","urena","urent","urged","urger","urges","urial","urite","urman","urnal","urned","urped","ursae","ursid","urson","urubu","urvas","users","usnea","usque","usure","usury","uteri","uveal","uveas","uvula","vacua","vaded","vades","vagal","vagus","vails","vaire","vairs","vairy","vakas","vakil","vales","valis","valse","vamps","vampy","vanda","vaned","vanes","vangs","vants","vaped","vaper","vapes","varan","varas","vardy","varec","vares","varia","varix","varna","varus","varve","vasal","vases","vasts","vasty","vatic","vatus","vauch","vaute","vauts","vawte","vaxes","veale","veals","vealy","veena","veeps","veers","veery","vegas","veges","vegie","vegos","vehme","veils","veily","veins","veiny","velar","velds","veldt","veles","vells","velum","venae","venal","vends","vendu","veney","venge","venin","vents","venus","verbs","verra","verry","verst","verts","vertu","vespa","vesta","vests","vetch","vexed","vexer","vexes","vexil","vezir","vials","viand","vibes","vibex","vibey","viced","vices","vichy","viers","views","viewy","vifda","viffs","vigas","vigia","vilde","viler","villi","vills","vimen","vinal","vinas","vinca","vined","viner","vines","vinew","vinic","vinos","vints","viold","viols","vired","vireo","vires","virga","virge","virid","virls","virtu","visas","vised","vises","visie","visne","vison","visto","vitae","vitas","vitex","vitro","vitta","vivas","vivat","vivda","viver","vives","vizir","vizor","vleis","vlies","vlogs","voars","vocab","voces","voddy","vodou","vodun","voema","vogie","voids","voile","voips","volae","volar","voled","voles","volet","volks","volta","volte","volti","volts","volva","volve","vomer","voted","votes","vouge","voulu","vowed","vower","voxel","vozhd","vraic","vrils","vroom","vrous","vrouw","vrows","vuggs","vuggy","vughs","vughy","vulgo","vulns","vulva","vutty","waacs","wacke","wacko","wacks","wadds","waddy","waded","wader","wades","wadge","wadis","wadts","waffs","wafts","waged","wages","wagga","wagyu","wahoo","waide","waifs","waift","wails","wains","wairs","waite","waits","wakas","waked","waken","waker","wakes","wakfs","waldo","walds","waled","waler","wales","walie","walis","walks","walla","walls","wally","walty","wamed","wames","wamus","wands","waned","wanes","waney","wangs","wanks","wanky","wanle","wanly","wanna","wants","wanty","wanze","waqfs","warbs","warby","wards","wared","wares","warez","warks","warms","warns","warps","warre","warst","warts","wases","washy","wasms","wasps","waspy","wasts","watap","watts","wauff","waugh","wauks","waulk","wauls","waurs","waved","waves","wavey","wawas","wawes","wawls","waxed","waxer","waxes","wayed","wazir","wazoo","weald","weals","weamb","weans","wears","webby","weber","wecht","wedel","wedgy","weeds","weeke","weeks","weels","weems","weens","weeny","weeps","weepy","weest","weete","weets","wefte","wefts","weids","weils","weirs","weise","weize","wekas","welds","welke","welks","welkt","wells","welly","welts","wembs","wends","wenge","wenny","wents","weros","wersh","wests","wetas","wetly","wexed","wexes","whamo","whams","whang","whaps","whare","whata","whats","whaup","whaur","wheal","whear","wheen","wheep","wheft","whelk","whelm","whens","whets","whews","wheys","whids","whift","whigs","whilk","whims","whins","whios","whips","whipt","whirr","whirs","whish","whiss","whist","whits","whity","whizz","whomp","whoof","whoot","whops","whore","whorl","whort","whoso","whows","whump","whups","whyda","wicca","wicks","wicky","widdy","wides","wiels","wifed","wifes","wifey","wifie","wifty","wigan","wigga","wiggy","wikis","wilco","wilds","wiled","wiles","wilga","wilis","wilja","wills","wilts","wimps","winds","wined","wines","winey","winge","wings","wingy","winks","winna","winns","winos","winze","wiped","wiper","wipes","wired","wirer","wires","wirra","wised","wises","wisha","wisht","wisps","wists","witan","wited","wites","withe","withs","withy","wived","wiver","wives","wizen","wizes","woads","woald","wocks","wodge","woful","wojus","woker","wokka","wolds","wolfs","wolly","wolve","wombs","womby","womyn","wonga","wongi","wonks","wonky","wonts","woods","wooed","woofs","woofy","woold","wools","woons","woops","woopy","woose","woosh","wootz","words","works","worms","wormy","worts","wowed","wowee","woxen","wrang","wraps","wrapt","wrast","wrate","wrawl","wrens","wrick","wried","wrier","wries","writs","wroke","wroot","wroth","wryer","wuddy","wudus","wulls","wurst","wuses","wushu","wussy","wuxia","wyled","wyles","wynds","wynns","wyted","wytes","xebec","xenia","xenic","xenon","xeric","xerox","xerus","xoana","xrays","xylan","xylem","xylic","xylol","xylyl","xysti","xysts","yaars","yabas","yabba","yabby","yacca","yacka","yacks","yaffs","yager","yages","yagis","yahoo","yaird","yakka","yakow","yales","yamen","yampy","yamun","yangs","yanks","yapok","yapon","yapps","yappy","yarak","yarco","yards","yarer","yarfa","yarks","yarns","yarrs","yarta","yarto","yates","yauds","yauld","yaups","yawed","yawey","yawls","yawns","yawny","yawps","ybore","yclad","ycled","ycond","ydrad","ydred","yeads","yeahs","yealm","yeans","yeard","years","yecch","yechs","yechy","yedes","yeeds","yeesh","yeggs","yelks","yells","yelms","yelps","yelts","yenta","yente","yerba","yerds","yerks","yeses","yesks","yests","yesty","yetis","yetts","yeuks","yeuky","yeven","yeves","yewen","yexed","yexes","yfere","yiked","yikes","yills","yince","yipes","yippy","yirds","yirks","yirrs","yirth","yites","yitie","ylems","ylike","ylkes","ymolt","ympes","yobbo","yobby","yocks","yodel","yodhs","yodle","yogas","yogee","yoghs","yogic","yogin","yogis","yoick","yojan","yoked","yokel","yoker","yokes","yokul","yolks","yolky","yomim","yomps","yonic","yonis","yonks","yoofs","yoops","yores","yorks","yorps","youks","yourn","yours","yourt","youse","yowed","yowes","yowie","yowls","yowza","yrapt","yrent","yrivd","yrneh","ysame","ytost","yuans","yucas","yucca","yucch","yucko","yucks","yucky","yufts","yugas","yuked","yukes","yukky","yukos","yulan","yules","yummo","yummy","yumps","yupon","yuppy","yurta","yurts","yuzus","zabra","zacks","zaida","zaidy","zaire","zakat","zaman","zambo","zamia","zanja","zante","zanza","zanze","zappy","zarfs","zaris","zatis","zaxes","zayin","zazen","zeals","zebec","zebub","zebus","zedas","zeins","zendo","zerda","zerks","zeros","zests","zetas","zexes","zezes","zhomo","zibet","ziffs","zigan","zilas","zilch","zilla","zills","zimbi","zimbs","zinco","zincs","zincy","zineb","zines","zings","zingy","zinke","zinky","zippo","zippy","ziram","zitis","zizel","zizit","zlote","zloty","zoaea","zobos","zobus","zocco","zoeae","zoeal","zoeas","zoism","zoist","zombi","zonae","zonda","zoned","zoner","zones","zonks","zooea","zooey","zooid","zooks","zooms","zoons","zooty","zoppa","zoppo","zoril","zoris","zorro","zouks","zowee","zowie","zulus","zupan","zupas","zuppa","zurfs","zuzim","zygal","zygon","zymes","zymic"]
}
},{}],35:[function(require,module,exports){
var axios = require("axios")
module.exports = async (url) => {
  var res = await axios.get(url)
  return res.data.split("\n")
  
}
},{"axios":2}],36:[function(require,module,exports){
var fetchit = require("./fetchit")

var cacheGuesses = require("./cache/guesses")
var cacheAnswers = require("./cache/answers")

module.exports = {
  guesses: async () => {
    return await fetchit("https://gist.githubusercontent.com/cfreshman/cdcdf777450c5b5301e439061d29694c/raw/de1df631b45492e0974f7affe266ec36fed736eb/wordle-allowed-guesses.txt")
  }, 
  answers: async () => {
    return await fetchit("https://gist.githubusercontent.com/cfreshman/a03ef2cba789d8cf00c08f767e0fad7b/raw/5d752e5f0702da315298a6bb5a771586d6ff445c/wordle-answers-alphabetical.txt")
  },

  all: async ( ) => {
    return [...await module.exports.guesses(), ...await module.exports.answers()].sort()
  },

  cache: {
    guesses: cacheGuesses.guesses,
    answers: cacheAnswers.answers,
    all: [...cacheGuesses.guesses, ... cacheAnswers.answers].sort()

    
  }
}
},{"./cache/answers":33,"./cache/guesses":34,"./fetchit":35}],37:[function(require,module,exports){
const Solver = require('wordle-solver');

// Configuration: Number of candidates to generate and sort
const CANDIDATE_COUNT = 20;

// Inline entropy calculation for browser compatibility
function calculateWordleFeedback(guess, target) {
    const guessLower = guess.toLowerCase();
    const targetLower = target.toLowerCase();
    const result = [];
    const usedTargetIndices = new Set();

    // First pass: mark correct positions (green)
    for (let i = 0; i < 5; i++) {
        if (guessLower[i] === targetLower[i]) {
            result[i] = { letter: guessLower[i], state: 'CORRECT' };
            usedTargetIndices.add(i);
        } else {
            result[i] = { letter: guessLower[i], state: 'ABSENT' };
        }
    }

    // Second pass: check for present letters (yellow)
    for (let i = 0; i < 5; i++) {
        if (result[i].state === 'ABSENT') {
            for (let j = 0; j < 5; j++) {
                if (!usedTargetIndices.has(j) && guessLower[i] === targetLower[j]) {
                    result[i].state = 'PRESENT';
                    usedTargetIndices.add(j);
                    break;
                }
            }
        }
    }
    return result;
}

function feedbackToString(feedback) {
    return feedback.map(f => `${f.letter}:${f.state}`).join('|');
}

function calculateAverageEntropy(guess, wordList) {
    const feedbackCounts = new Map();

    // Calculate feedback for each possible target word
    for (const target of wordList) {
        const feedback = calculateWordleFeedback(guess, target);
        const feedbackKey = feedbackToString(feedback);
        feedbackCounts.set(feedbackKey, (feedbackCounts.get(feedbackKey) || 0) + 1);
    }

    // Calculate entropy: sum of -p * log2(p)
    const totalWords = wordList.length;
    let entropy = 0;
    for (const count of feedbackCounts.values()) {
        const probability = count / totalWords;
        if (probability > 0) {
            entropy += probability * (-Math.log2(probability));
        }
    }
    return entropy;
}

class WordleSolver {
    constructor() {
        this.solver = new Solver();
        this.logger = console;
    }

    validateInput(guesses) {
        const errors = [];

        if (!Array.isArray(guesses)) {
            errors.push('Guesses must be an array');
            return { isValid: false, errors };
        }

        if (guesses.length === 0) {
            errors.push('Are you using this for the first guess? Try SLATE or CRANE.');
            return { isValid: false, errors };
        }

        guesses.forEach((guess, index) => {
            if (!Array.isArray(guess) || guess.length !== 2) {
                errors.push(`Guess ${index + 1}: Must be an array with exactly 2 elements [word, colors]`);
                return;
            }

            const [word, colors] = guess;

            if (typeof word !== 'string') {
                errors.push(`Guess ${index + 1}: Word must be a string`);
            } else if (!/^[a-zA-Z]{5}$/.test(word)) {
                errors.push(`Guess ${index + 1}: Word must be exactly 5 letters containing only alphabetic characters`);
            }

            if (typeof colors !== 'string') {
                errors.push(`Guess ${index + 1}: Colors must be a string`);
            } else if (!/^[gybGYB]{5}$/.test(colors)) {
                errors.push(`Guess ${index + 1}: Colors must be exactly 5 characters using only 'g' (green), 'y' (yellow), 'b' (black/gray)`);
            }

            if (word && colors && word.length !== colors.length) {
                errors.push(`Guess ${index + 1}: Word and colors must have the same length`);
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    processGuessResults(guesses) {
        const validation = this.validateInput(guesses);
        if (!validation.isValid) {
            throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
        }

        this.logger.log(`Processing ${guesses.length} guess(es)`);

        guesses.forEach((guess, index) => {
            const [word, colors] = guess;
            const normalizedWord = word.toLowerCase();
            const normalizedColors = colors.toLowerCase();

            this.logger.log(`Processing guess ${index + 1}: "${normalizedWord}" with colors "${normalizedColors}"`);

            this.solver.guess(normalizedWord, normalizedColors);

            this.logger.log(`  - Applied guess to solver`);
        });

        return this;
    }

    getNextBestGuess() {
        try {
            const bestGuess = this.solver.getNextBestGuess();
            this.logger.log(`Best next guess: "${bestGuess}"`);
            return bestGuess;
        } catch (error) {
            this.logger.error('Error getting next best guess:', error);
            throw new Error(`Failed to get next best guess: ${error.message}`);
        }
    }

    getNextBestGuesses(count = CANDIDATE_COUNT) {
        try {
            const bestGuesses = this.solver.getNextBestGuesses(count);
            this.logger.log(`Top ${count} best guesses:`, bestGuesses);
            return bestGuesses;
        } catch (error) {
            this.logger.error('Error getting next best guesses:', error);
            throw new Error(`Failed to get next best guesses: ${error.message}`);
        }
    }

    getPossibleWords() {
        try {
            const possibleWords = this.solver.getPossibleWords();
            this.logger.log(`${possibleWords.length} possible words remaining`);
            return possibleWords;
        } catch (error) {
            this.logger.error('Error getting possible words:', error);
            throw new Error(`Failed to get possible words: ${error.message}`);
        }
    }

    /**
     * Sorts candidates using entropy-based information theory from /wordle-solver
     * @param {number} count - Number of initial candidates to evaluate
     * @returns {Promise<Array>} - Ranked list sorted by entropy (highest first)
     */
    async sortByEntropy(count = CANDIDATE_COUNT) {
        try {
            // Get initial candidates from the original solver
            const candidates = this.getNextBestGuesses(count);

            if (!candidates || candidates.length === 0) {
                throw new Error('NO_CANDIDATES');
            }

            this.logger.log(`Sorting ${candidates.length} candidates using entropy calculation...`);

            // Get all possible remaining words as the answer space
            const possibleAnswers = this.getPossibleWords();

            if (possibleAnswers.length === 0) {
                throw new Error('NO_CANDIDATES');
            }

            this.logger.log(`Evaluating against ${possibleAnswers.length} possible answers`);

            // Use inline entropy calculation (works in both Node and browser)
            const rankedByEntropy = candidates.map((word) => {
                try {
                    const entropy = calculateAverageEntropy(
                        word.toLowerCase(),
                        possibleAnswers.map(w => w.toLowerCase())
                    );

                    return {
                        word: word.toLowerCase(),
                        entropy: entropy,
                        isPossibleAnswer: possibleAnswers.includes(word.toLowerCase())
                    };
                } catch (error) {
                    this.logger.error(`Error calculating entropy for "${word}":`, error.message);
                    return {
                        word: word.toLowerCase(),
                        entropy: 0,
                        isPossibleAnswer: possibleAnswers.includes(word.toLowerCase()),
                        error: true
                    };
                }
            });

            // Log entropy scores before sorting (original order from wordle-solver)
            this.logger.log('=== Original Ranking (from wordle-solver) ===');
            const originalOrder = candidates.slice(0, 10).map((word, index) => {
                const matchingEntry = rankedByEntropy.find(item => item.word === word.toLowerCase());
                this.logger.log(`  ${index + 1}. "${word.toUpperCase()}" → Entropy: ${matchingEntry.entropy.toFixed(4)} bits`);
                return {
                    word: word.toLowerCase(),
                    originalRank: index + 1,
                    entropy: matchingEntry.entropy
                };
            });

            // Sort by entropy (highest first)
            rankedByEntropy.sort((a, b) => b.entropy - a.entropy);

            // Log entropy scores after sorting and show rank changes
            this.logger.log('\n=== After Entropy Sorting (Re-ranked) ===');
            rankedByEntropy.slice(0, 10).forEach((item, index) => {
                const newRank = index + 1;
                const originalData = originalOrder.find(o => o.word === item.word);
                const oldRank = originalData ? originalData.originalRank : '?';
                const rankChange = originalData ? (originalData.originalRank - newRank) : 0;
                const arrow = rankChange > 0 ? `↑${rankChange}` : rankChange < 0 ? `↓${Math.abs(rankChange)}` : '—';

                this.logger.log(`  ${newRank}. "${item.word.toUpperCase()}" → Entropy: ${item.entropy.toFixed(4)} bits [${arrow} was #${oldRank}]`);
            });

            // Assign ranks
            rankedByEntropy.forEach((item, index) => {
                item.rank = index + 1;
            });

            const topGuess = rankedByEntropy[0];
            const originalTopData = originalOrder.find(o => o.word === topGuess.word);
            const wasRank = originalTopData ? originalTopData.originalRank : '?';
            this.logger.log(`\n✅ Best guess after entropy sorting: "${topGuess.word.toUpperCase()}" (was #${wasRank}, entropy: ${topGuess.entropy.toFixed(4)} bits)`);

            return rankedByEntropy;
        } catch (error) {
            this.logger.error('Error sorting by entropy:', error);
            throw new Error(`Failed to sort by entropy: ${error.message}`);
        }
    }

    async getRankedNextGuesses(count = CANDIDATE_COUNT) {
        try {
            // Use entropy-based sorting for better ranking
            const rankedByEntropy = await this.sortByEntropy(count);

            this.logger.log(`Created ranked list of ${rankedByEntropy.length} guesses using information theory`);

            return rankedByEntropy;
        } catch (error) {
            this.logger.error('Error creating ranked guess list:', error);
            throw new Error(`Failed to create ranked guess list: ${error.message}`);
        }
    }

    resetSolver() {
        this.solver = new Solver();
        this.logger.log('Solver has been reset');
        return this;
    }

    getGameState() {
        try {
            const possibleWords = this.getPossibleWords();
            const nextBestGuess = possibleWords.length > 0 ? this.getNextBestGuess() : null;

            return {
                remainingPossibilities: possibleWords.length,
                possibleWords: possibleWords.slice(0, CANDIDATE_COUNT),
                nextBestGuess: nextBestGuess,
                gameComplete: possibleWords.length === 1
            };
        } catch (error) {
            this.logger.error('Error getting game state:', error);
            throw new Error(`Failed to get game state: ${error.message}`);
        }
    }

    validateWords(words) {
        try {
            this.logger.log(`Validating ${words.length} words against Wordle word list`);

            const allValidWords = this.solver.getAllWords();
            const invalidWords = words.filter(word => !allValidWords.includes(word.toLowerCase()));

            return {
                isValid: invalidWords.length === 0,
                invalidWords: invalidWords,
                totalChecked: words.length
            };
        } catch (error) {
            this.logger.error('Error validating words:', error);
            throw new Error(`Failed to validate words: ${error.message}`);
        }
    }
}

async function solveWordle(guesses, options = {}) {
    const { count = CANDIDATE_COUNT, includeGameState = false } = options;

    try {
        const solver = new WordleSolver();
        solver.processGuessResults(guesses);

        const rankedGuesses = await solver.getRankedNextGuesses(count);

        const result = {
            rankedGuesses: rankedGuesses,
            nextBestGuess: rankedGuesses[0].word
        };

        if (includeGameState) {
            result.gameState = solver.getGameState();
        }

        return result;
    } catch (error) {
        throw new Error(`Wordle solving failed: ${error.message}`);
    }
}

module.exports = {
    WordleSolver,
    solveWordle,
    CANDIDATE_COUNT
};
},{"wordle-solver":32}]},{},[37])(37)
});
