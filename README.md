# bookshelf-touch

This [Bookshelf.js](http://bookshelfjs.org) plugin automatically updates your timestamps when saving your Bookshelf models.

[![npm version](https://badge.fury.io/js/bookshelf-touch.svg)](https://badge.fury.io/js/bookshelf-touch)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)

## Usage

```js
const knex = require('knex')({ ... });
const bookshelf = require('bookshelf')(knex);
const touch = require('bookshelf-touch');

bookshelf.plugin(touch);

const MyModel = bookshelf.Model.extend({
  tableName: 'my_table',
  // Define which timestamps you want to be automatically updated.
  timestamps: [ 'created_at', 'updated_at' ]
});

const model = new MyModel({
  name: 'Awesome'
});

// Both timestamps are automatically set when the model is created.
model.save();

// Only the updated_at timestamp is updated when the model is saved.
model.name = 'Indeed';
model.save();
```

## Configuration

The `timestamps` property of your model can be:

* `true` to automatically update both `created_at` and `updated_at`.

* An array containing either `created_at`, `updated_at` or both to indicate which should be updated.

* A string indicating which of `created_at` or `updated_at` should be updated.

* Do not define it to disable the plugin on that model.
