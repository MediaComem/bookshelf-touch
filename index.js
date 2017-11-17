module.exports = function(bookshelf) {

  const proto = bookshelf.Model.prototype;

  bookshelf.Model = bookshelf.Model.extend({

    constructor: function() {
      proto.constructor.apply(this, arguments);
      this.on('saving', this.touch, this);
    },

    touch: function() {

      const hasCreatedAt = this.has('created_at');
      if (isTimestampEnabled(this, 'created_at') && !hasCreatedAt) {
        this.set('created_at', new Date());
      }

      const hasUpdatedAt = this.has('updated_at');
      if (isTimestampEnabled(this, 'updated_at')) {
        this.set('updated_at', hasCreatedAt && hasUpdatedAt ? new Date() : this.get('created_at') || new Date());
      }
    }
  });
};

function isTimestampEnabled(record, timestamp) {
  const timestamps = record.timestamps;
  if (!timestamps) {
    return false;
  } else if (Array.isArray(timestamps)) {
    return timestamps.indexOf(timestamp) >= 0;
  } else if (typeof(timestamps) == 'string') {
    return timestamps == timestamp;
  } else if (timestamps === true) {
    return true;
  } else {
    throw new Error(`"timestamps" property should be true, a string or an array, got ${JSON.stringify(timestamps)} (${typeof(timestamps)})`);
  }
}
