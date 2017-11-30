module.exports = function(bookshelf) {

  const proto = bookshelf.Model.prototype;

  bookshelf.Model = bookshelf.Model.extend({

    constructor: function() {
      proto.constructor.apply(this, arguments);
      this.on('saving', () => this.touch());
    },

    touch: function() {

      const config = getTimestampsConfig(this);
      for (let timestamp in config) {
        const timestampConfig = config[timestamp];
        if (timestampConfig) {
          touchTimestamp(this, timestamp, timestampConfig === true ? defaultConfig[timestamp] : timestampConfig);
        }
      }
    }
  });
};

const defaultConfig = {
  created_at: {},
  updated_at: {
    default: record => record.get('created_at'),
    update: true
  }
};

function touchTimestamp(record, timestamp, config) {

  const isSet = record.get(timestamp);
  if (isSet && config.update && !record.isNew()) {
    // Update the timestamp (only if "update" is true).
    record.set(timestamp, new Date());
  } else if (isSet) {
    // Do not do anything if the timestamp is already set and "update" is not true.
    return;
  } else {
    // Initialize the timestamp if not set (to its default value or to now).
    record.set(timestamp, config.default ? config.default(record) || new Date() : new Date());
  }
}

function getTimestampsConfig(record) {
  const timestamps = record.timestamps;
  if (!timestamps) {
    return {};
  } else if (Array.isArray(timestamps)) {

    const config = {};
    for (let property in defaultConfig) {
      if (timestamps.indexOf(property) >= 0) {
        config[property] = defaultConfig[property];
      }
    }

    return config;
  } else if (typeof(timestamps) == 'string') {
    return {
      [timestamps]: defaultConfig[timestamps]
    };
  } else if (timestamps === true) {
    return defaultConfig;
  } else if (typeof(timestamps) == 'object') {
    return timestamps;
  } else {
    throw new Error(`"timestamps" property should be true, a string or an array, got ${JSON.stringify(timestamps)} (${typeof(timestamps)})`);
  }
}
