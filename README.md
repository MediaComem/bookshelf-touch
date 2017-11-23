# bookshelf-touch

This [Bookshelf.js](http://bookshelfjs.org) plugin automatically updates your timestamps when saving your Bookshelf models.

[![npm version](https://badge.fury.io/js/bookshelf-touch.svg)](https://badge.fury.io/js/bookshelf-touch)
[![Build Status](https://travis-ci.org/MediaComem/bookshelf-touch.svg?branch=master)](https://travis-ci.org/MediaComem/bookshelf-touch)
[![Coverage Status](https://coveralls.io/repos/github/MediaComem/bookshelf-touch/badge.svg?branch=master)](https://coveralls.io/github/MediaComem/bookshelf-touch?branch=master)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE.txt)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Usage](#usage)
- [Configuration](#configuration)
  - [Timestamp configuration](#timestamp-configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

Developed at the [Media Engineering Institute](http://mei.heig-vd.ch) ([HEIG-VD](https://heig-vd.ch)).



## Usage

```js
const knex = require('knex')({ ... });
const bookshelf = require('bookshelf')(knex);
const touch = require('bookshelf-touch');

bookshelf.plugin(touch);

const MyModel = bookshelf.Model.extend({
  tableName: 'my_table',
  // Define which timestamps you want to be automatically updated
  // (supports "created_at" and "updated_at" by default, but you
  // can configure more).
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

// You can trigger an update of the timestamps with the touch method
// (this does not save the model):
model.touch();
```



## Configuration

The `timestamps` property of your model can be:

* `true` to automatically update both `created_at` and `updated_at`.

* A string indicating which of `created_at` or `updated_at` should be updated.

* An array containing either `created_at`, `updated_at` or both to indicate which should be updated.

* An object mapping timestamp columns as keys to timestamp configurations as value. See [Timestamp configuration](#timestamp-configuration) below.

* Do not define it or set it to false to disable the plugin on that model.

### Timestamp configuration

You may configure the behavior of timestamps (and add timestamps) yourself.
This is what the default configuration looks like:

```js
const MyModel = bookshelf.Model.extend({
  tableName: 'my_table',
  timestamps: {
    created_at: {}
    updated_at: {
      default: record => record.get('created_at'),
      update: true
    }
  }
});
```

A timestamp configuration object has 2 options:

* `default` - A function that takes the record as an argument and should return a default value.
  This function will be called if the record has no value for that timestamp, or when updating
  the timestamp. If it returns a falsy value, a new date is created instead. If the default
  function is not specified (like for `created_at`), a new date is also created as the default
  value.
* `update` - Whether to update the timestamp when the record is touched. This defaults to false.
  As expected, it is not set for `created_at` and set to true for `updated_at` in the default
  configuration.

You may define new timestamps by adding them to the configuration.
Use true and false to enable/disable default timestamps:

```js
const MyModel = bookshelf.Model.extend({
  tableName: 'my_table',
  timestamps: {
    created_at: true,
    updated_at: false,
    amended_at: {
      default: record => new Date(11029388)
    }
  }
});
```
