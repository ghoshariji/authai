const ApiResponse = require('../utils/apiResponse');

/**
 * Joi validation middleware factory.
 * @param {Object} schema - Joi schema with optional keys: body, query, params
 * @param {string} [source='body'] - Where to validate: 'body', 'query', 'params'
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));
      return ApiResponse.validationError(res, errors);
    }

    req[source] = value;
    next();
  };
};

/**
 * Validate multiple sources at once.
 * @param {Object} schemas - Object with keys matching sources: { body, query, params }
 */
const validateMulti = (schemas) => {
  return (req, res, next) => {
    const allErrors = [];

    for (const [source, schema] of Object.entries(schemas)) {
      const { error, value } = schema.validate(req[source] || {}, {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
      });

      if (error) {
        error.details.forEach((detail) => {
          allErrors.push({
            source,
            field: detail.path.join('.'),
            message: detail.message.replace(/['"]/g, ''),
          });
        });
      } else {
        req[source] = value;
      }
    }

    if (allErrors.length > 0) {
      return ApiResponse.validationError(res, allErrors);
    }

    next();
  };
};

module.exports = { validate, validateMulti };
