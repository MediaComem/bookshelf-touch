/* istanbul ignore file */
const bookshelf = require('bookshelf');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const chaiMoment = require('chai-moment');
const knex = require('knex');
const _ = require('lodash');
const moment = require('moment');
const uuid = require('uuid');

const bookshelfTouch = require('../');
const knexConfig = require('../knexfile').test;

const expect = chai.expect;
chai.use(chaiMoment);
chai.use(chaiAsPromised);

const db = knex(knexConfig);

const Bookshelf = bookshelf(db);
Bookshelf.plugin(bookshelfTouch);

describe('bookshelf-touch', () => {

  let now;
  beforeEach(() => {
    now = moment().subtract(1, 'millisecond').toDate();
  });

  it('should not accept an invalid timestamps option', async () => {
    const Test = createModel({ timestamps: 42 });
    await expect(new Test().save()).to.be.rejectedWith('"timestamps" property should be true, a string or an array, got 42 (number)');
  });

  describe('with the timestamps option set to true', () => {
    itShouldBehaveNormally({ timestamps: true });
  });

  describe('with the timestamps option set to an array containing "created_at" and "updated_at"', () => {
    itShouldBehaveNormally({ timestamps: [ 'created_at', 'updated_at' ] });
  });

  describe('with the timestamps option set to the default configuration', () => {
    itShouldBehaveNormally({
      timestamps: {
        created_at: {},
        updated_at: {
          default: record => record.get('created_at'),
          update: true
        }
      }
    });
  });

  describe('with the "timestamps" option not set', () => {
    itShouldNotDoAnything();
  });

  describe('with the "timestamps" option set to false', () => {
    itShouldNotDoAnything({ timestamps: false });
  });

  describe('with the "timestamps" option set to an empty array', () => {
    itShouldNotDoAnything({ timestamps: [] });
  });

  describe('with the "timestamps" option set to an empty object', () => {
    itShouldNotDoAnything({ timestamps: {} });
  });

  describe('with the "timestamps" option set to an object with "created_at" and "updated_at" properties equal to false', () => {
    itShouldNotDoAnything({ timestamps: { created_at: false, updated_at: false } });
  });

  describe('with the "timestamps" option set to "created_at"', () => {
    itShouldUpdateCreatedAt({ timestamps: 'created_at' });
  });

  describe('with the "timestamps" option set to an array containing "created_at"', () => {
    itShouldUpdateCreatedAt({ timestamps: [ 'created_at' ] });
  });

  describe('with the "timestamps" option set to an object containing a "created_at" property equal to true', () => {
    itShouldUpdateCreatedAt({ timestamps: { created_at: true } });
  });

  describe('with the "timestamps" option set to an object containing a "created_at" property equal to its default configuration', () => {
    itShouldUpdateCreatedAt({ timestamps: { created_at: {} } });
  });

  describe('with the "timestamps" option set to "updated_at"', () => {
    itShouldUpdateUpdatedAt({ timestamps: 'updated_at' });
  });

  describe('with the "timestamps" option set to an array containing "updated_at"', () => {
    itShouldUpdateUpdatedAt({ timestamps: [ 'updated_at' ] });
  });

  describe('with the "timestamps" option set to an object containing an "updated_at" property equal to true', () => {
    itShouldUpdateUpdatedAt({ timestamps: { updated_at: true } });
  });

  describe('with the "timestamps" option set to an object containing an "updated_at" property equal to its default configuration', () => {
    itShouldUpdateUpdatedAt({
      timestamps: {
        updated_at: {
          default: record => record.get('created_at'),
          update: true
        }
      }
    });
  });

  describe('with the "timestamps" option set to an object with an additional "touched_at" timestamp', () => {

    let Test;
    beforeEach(() => {
      Test = createModel({
        timestamps: {
          created_at: true,
          updated_at: true,
          touched_at: {
            update: true
          }
        }
      });
    });

    it('should initialize "created_at", "updated_at" and "touched_at"', async () => {

      const record = await new Test().save({ name: 'John Doe' });

      expectTimestampAfter(record, 'created_at', now);
      expectTimestamp(record, 'updated_at', record.get('created_at'));
      expectTimestampAfter(record, 'touched_at', now);

      await expectDatabaseRow({
        id: record.id,
        name: 'John Doe',
        created_at: record.get('created_at'),
        updated_at: record.get('updated_at'),
        touched_at: record.get('touched_at')
      })
    });

    it('should update only "updated_at" and "touched_at"', async () => {

      const twoDaysAgo = moment().subtract(2, 'days').toDate();

      const record = await createRecord(Test, {
        name: 'John Doe',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo,
        touched_at: twoDaysAgo
      });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectTimestamp(record, 'touched_at', twoDaysAgo);

      await record.save({ name: 'Bob Smith' });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestampAfter(record, 'updated_at', now);
      expectTimestampAfter(record, 'touched_at', now);
    });
  });

  function itShouldBehaveNormally(config) {
    it('should initialize both created_at and updated_at', async () => {

      const Test = createModel(config);
      const record = await new Test().save({ name: 'John Doe' });

      expectTimestampAfter(record, 'created_at', now);
      expectTimestamp(record, 'updated_at', record.get('created_at'));
      expectNoTimestamp(record, 'touched_at');

      await expectDatabaseRow({
        id: record.id,
        name: 'John Doe',
        created_at: record.get('created_at'),
        updated_at: record.get('updated_at')
      })
    });

    it('should update only updated_at', async () => {

      const twoDaysAgo = moment().subtract(2, 'days').toDate();

      const Test = createModel(config);
      const record = await createRecord(Test, {
        name: 'John Doe',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');

      await record.save({ name: 'Bob Smith' });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestampAfter(record, 'updated_at', now);
      expectNoTimestamp(record, 'touched_at');
    });
  }

  function itShouldNotDoAnything(config) {
    it('should not initialize any timestamp', async () => {

      const Test = createModel(config);
      const record = await new Test().save({ name: 'John Doe' });

      expectNoTimestamp(record, 'created_at');
      expectNoTimestamp(record, 'updated_at');
      expectNoTimestamp(record, 'touched_at');

      await expectDatabaseRow({
        id: record.id,
        name: 'John Doe'
      })
    });

    it('should not update any timestamp', async () => {

      const twoDaysAgo = moment().subtract(2, 'days').toDate();

      const Test = createModel(config);
      const record = await createRecord(Test, {
        name: 'John Doe',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');

      await record.save({ name: 'Bob Smith' });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');
    });
  }

  function itShouldUpdateCreatedAt(config) {
    it('should initialize only "created_at"', async () => {

      const Test = createModel(config);
      const record = await new Test().save({ name: 'John Doe' });

      expectTimestampAfter(record, 'created_at', now);
      expectNoTimestamp(record, 'updated_at');
      expectNoTimestamp(record, 'touched_at');

      await expectDatabaseRow({
        id: record.id,
        name: 'John Doe',
        created_at: record.get('created_at')
      })
    });

    it('should not update "created_at" or any other timestamp', async () => {

      const twoDaysAgo = moment().subtract(2, 'days').toDate();

      const Test = createModel(config);
      const record = await createRecord(Test, {
        name: 'John Doe',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');

      await record.save({ name: 'Bob Smith' });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');
    });
  }

  function itShouldUpdateUpdatedAt(config) {
    it('should initialize only "updated_at"', async () => {

      const Test = createModel(config);
      const record = await new Test().save({ name: 'John Doe' });

      expectNoTimestamp(record, 'created_at');
      expectTimestampAfter(record, 'updated_at', now);
      expectNoTimestamp(record, 'touched_at');

      await expectDatabaseRow({
        id: record.id,
        name: 'John Doe',
        updated_at: record.get('updated_at')
      })
    });

    it('should update only "updated_at"', async () => {

      const twoDaysAgo = moment().subtract(2, 'days').toDate();

      const Test = createModel(config);
      const record = await createRecord(Test, {
        name: 'John Doe',
        created_at: twoDaysAgo,
        updated_at: twoDaysAgo
      });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestamp(record, 'updated_at', twoDaysAgo);
      expectNoTimestamp(record, 'touched_at');

      await record.save({ name: 'Bob Smith' });

      expectTimestamp(record, 'created_at', twoDaysAgo);
      expectTimestampAfter(record, 'updated_at', now);
      expectNoTimestamp(record, 'touched_at');
    });
  }
});

function createModel(options) {
  const proto = Bookshelf.Model.prototype;
  return Bookshelf.Model.extend(_.extend({
    tableName: 'tests',
    initialize: function() {
      proto.initialize.apply(this, arguments);
      this.on('creating', () => this.set('id', uuid.v4()));
    }
  }, options));
}

async function createRecord(model, properties) {

  _.defaults(properties, {
    id: uuid.v4()
  });

  await db.insert(properties).into('tests');

  return new model({ id: properties.id }).fetch();
}

function expectTimestamp(record, name, value) {
  expect(record.get(name)).to.be.ok;
  expect(record.get(name)).to.be.sameMoment(value);
}

function expectTimestampAfter(record, name, value) {
  expect(record.get(name)).to.be.ok;
  expect(record.get(name)).to.be.afterMoment(value);
  expect(record.get(name)).to.be.beforeMoment(moment(value).add('250', 'milliseconds'));
}

function expectNoTimestamp(record, name) {
  expect(record.get(name)).not.to.be.ok;
}

async function expectDatabaseRow(expected) {
  if (!expected) {
    throw new Error('Expected row is required');
  } else if (!expected.id) {
    throw new Error('Expected row must have an "id" property');
  }

  const row = await fetchDatabaseRow(expected.id);
  expect(row).to.eql({
    id: expected.id,
    name: expected.name,
    created_at: expected.created_at ? expected.created_at.getTime() : null,
    updated_at: expected.updated_at ? expected.updated_at.getTime() : null,
    touched_at: expected.touched_at ? expected.touched_at.getTime() : null
  });
}

function fetchDatabaseRow(id) {
  return db.select('*').from('tests').where('id', id).then(rows => {
    expect(rows).to.have.lengthOf(1);
    return rows[0];
  });
}
