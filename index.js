const express = require('express');
const { rateLimit } = require("express-rate-limit");
const csv = require('csv-parser');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors')
const ValidationFunctions = require('./validationFunctions');
const { urlUtils } = require("./utils/urlUtils");
const expressJSDocSwagger = require('express-jsdoc-swagger');

// Constants
const MAX_REQUEST_SIZE = '10mb';  // Maximum request body size (10 megabytes)
const MAX_REQUEST_SIZE_BYTES = 10 * 1024 * 1024;  // 10MB in bytes
const requiredParameterResponse = 'Input string required as a parameter.';

// Load environment variables
require('dotenv').config();
/**
 * Global rate limiter middleware
 * limits the number of request sent to our application
 * each IP can make up to 1000 requests per `windowsMs` (1 minute)
 */
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 1000, 
  standardHeaders: true, 
  legacyHeaders: false, 
});

const options = {
  info: {
    version: '1.0.0',
    title: 'Readable Regex',
    license: {
      name: 'MIT',
    },
  },
  //TODO will add this later when we have API tokens
  // security: {
  //   BasicAuth: {
  //     type: 'http',
  //     scheme: 'basic',
  //   },
  // },
  // Base directory which we use to locate your JSDOC files
  baseDir: __dirname,
  // Glob pattern to find your jsdoc files (multiple patterns can be added in an array)
  // This pattern finds any .js file. The default value from the docs didn't work
  filesPattern: '*.js',
  // URL where SwaggerUI will be rendered
  swaggerUIPath: '/api-docs',
  // Expose OpenAPI UI
  exposeSwaggerUI: true,
  // Expose Open API JSON Docs documentation in `apiDocsPath` path.
  exposeApiDocs: false,
  // Open API JSON Docs endpoint.
  apiDocsPath: '/v3/api-docs',
  // Set non-required fields as nullable by default
  notRequiredAsNullable: false,
  // You can customize your UI options.
  // you can extend swagger-ui-express config. You can checkout an example of this
  // in the `example/configuration/swaggerOptions.js`
  swaggerUiOptions: {},
  // multiple option in case you want more that one instance
  multiple: true,
};

expressJSDocSwagger(app)(options);


app.use(limiter)

// Set API URL based on environment
const apiUrl =
  process.env.NODE_ENV === 'production'
    ? process.env.PROD_API_URL
    : 'http://localhost:3000'

app.use(cors())
// Middleware to parse JSON request bodies with size limit
app.use(express.json({ 
  limit: MAX_REQUEST_SIZE,
  verify: (req, res, buf) => {
    if (buf.length > MAX_REQUEST_SIZE_BYTES) {
      throw new Error('Request payload too large');
    }
  }
}));
app.use(express.raw({ limit: MAX_REQUEST_SIZE }));
app.set('view engine', 'pug');

// Error handling middleware for payload size errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 413) {
    return res.status(413).json({ error: 'Input exceeds maximum size of 10MB' });
  }
  if (err.message === 'Request payload too large') {
    return res.status(413).json({ error: 'Input exceeds maximum size of 10MB' });
  }
  next(err);
});

/**
 * Basic request
 * @typedef {object} BasicRequest
 * @property {string} inputString.required - Input string
 */

/**
 * Basic response
 * @typedef {object} BasicResponse
 * @property {string} result - Result
 */

/**
 * Bad request response
 * @typedef {object} BadRequestResponse
 * @property {string} error
 */

/**
 * POST /api/isEmailAddress
 * @summary Returns true if valid email address, false otherwise
 * @param {BasicRequest} request.body.required
 * @return {BasicResponse} 200 - Success response
 * @return {BadRequestResponse} 400 - Bad request response
 * @example request - test
 * {
 *   "inputString": "test@gmail.com"
 * }
 * @example response - 200 - example payload
 * {
 *   "result": true
 * }
 * @example response - 400 - example
 * {
 *   "error": "Input string required as a parameter."
 * }
 */
app.post('/api/isEmailAddress', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isEmailAddress(inputString);
  res.json({ result });
});

app.post('/api/isPhoneNumber', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isPhoneNumber(inputString);
  res.json({ result });
});

// POST route for onlySpecialCharacters
app.post('/api/onlySpecialCharacters', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlySpecialCharacters(inputString);
  res.json({ result });
});

// POST route for trim
app.post('/api/trim', (req, res) => {
  const inputString = req.body.inputString;
  
  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.trim(inputString);
  res.json({ result });
});

// Example using query parameters (POST requests)

app.post('/api/onlyNumbers', (req, res) => {
  const { inputString } = req.body;
  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlyNumbers(inputString);
  res.json({ result });
});

app.post('/api/onlyLetters', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.onlyLetters(inputString);
  res.json({ result });
});

// POST route for excludeTheseCharacters
app.post("/api/excludeTheseCharacters", (req, res) => {
  const { excludeTheseCharacters, inputString } = req.body;

  if (!excludeTheseCharacters || !inputString) {
    return res.status(400).json({
      error: "excludeTheseCharacters and inputString are required.",
    });
  }

  const result = ValidationFunctions.excludeTheseCharacters(inputString, excludeTheseCharacters);
  res.json({ result });

})

app.post('/api/isAlphaNumeric', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isAlphaNumeric(inputString);
  res.json({ result });
});


app.post('/api/isZipCode', (req, res) => {
  const { inputString, countryCode } = req.body;

  const patterns = {
    US: /^\d{5}(-\d{4})?$/,
    UK: /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/i,
    CA: /^[A-Z]\d[A-Z] \d[A-Z]\d$/i,
    AU: /^\d{4}$/,
    DE: /^\d{5}$/,
    FR: /^\d{5}$/,
    JP: /^\d{3}-\d{4}$/,
    BR: /^\d{5}-\d{3}$/,
    IN: /^[1-9]\d{5}$/
  };

  if (!inputString || !countryCode) {
    return res.status(400).json({ error: 'inputString and countryCode are required.' });
  }

  const upperCountryCode = countryCode.toUpperCase();

  if (!patterns[upperCountryCode]) {
    return res.status(400).json({ 
      error: 'Country code not supported at this time. If this is a valid country code, please open an issue with the developers.', 
      supportedCountries: Object.keys(patterns) 
    });
  }

  const result = ValidationFunctions.isZipCode(inputString, upperCountryCode, patterns);
  res.json({ result });
});

app.post('/api/isInteger', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({
      error: 'inputString is required.',
    });
  }

  const result = ValidationFunctions.isInteger(inputString);
  

  res.json({ result });
});

app.post('/api/isHexadecimal', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isHexadecimal(inputString);
  res.json({ result });
});
app.post('/api/isDecimal', (req, res) => {
  const { inputString } = req.body;
  
  if (!inputString) {
      return res.status(400).json({ 
          error: "inputString is required." 
      });
  }
  
  const result = ValidationFunctions.isDecimal(inputString);
  
  res.json({ result });
});

app.post('/api/isLowercase', (req, res) => {
  const { inputString } = req.body;

  if(!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isLowercase(inputString);

  res.json({ result });
});

app.post('/api/isDate', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  const result = ValidationFunctions.isDate(inputString);
  res.json({ result });
});

app.post('/api/onlyTheseCharacters', (req, res) => {
  const { onlyTheseCharacters, inputString } = req.body;

  if (!onlyTheseCharacters || !inputString) {
    return res.status(400).json({
      error: "characters to include and inputString are required.",
    });
  }

  const result = ValidationFunctions.includeOnlyTheseCharacters(inputString, onlyTheseCharacters);
  res.json({ result });
});

app.post('/api/isAllCaps', (req, res) => {
  const { inputString } = req.body;

  if(!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isAllCaps(inputString);

  res.json({ result });
});

app.post('/api/isUrl', async (req, res) => {
  const inputString = req.body.inputString;
  const connectToUrlTest = req.body.connectToUrlTest ?? false
  
  if(!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isUrl(inputString);
    
  if(!connectToUrlTest){
    return res.json({ result });
  }

  const connectToUrlResult = await urlUtils.isUrlReachable(inputString);

  return res.json({
    result,
    connectToUrlResult
  });
});

app.post('/api/isBinaryString', (req, res) => {
  const inputString = req.body.inputString;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }
  const result = ValidationFunctions.isBinaryString(inputString);
  return res.json({ result });
});

app.post('/api/isCSV', (req, res) => {
  const { inputString } = req.body;

  if (!inputString) {
    return res.status(400).json({ error: requiredParameterResponse });
  }

  // Check if input size exceeds limit
  if (Buffer.byteLength(inputString, 'utf8') > MAX_REQUEST_SIZE_BYTES) {
    return res.status(413).json({ error: 'Input exceeds maximum size of 10MB' });
  }

  const records = [];
  const csvParser = csv({ headers: false });

  csvParser.on('data', (row) => {
    records.push(row);
  });

  csvParser.on('end', () => {
    res.json({ result: true });
  });

  csvParser.on('error', (err) => {
    console.error(err);
    res.status(500).json({ error: 'Failed to parse CSV data' });
  });

  csvParser.write(inputString);
  csvParser.end();
});

app.get('/', (req, res) => {
  res.render('index');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log(`API URL: ${apiUrl}`);
});
