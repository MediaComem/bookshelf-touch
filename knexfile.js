const config = {
  client: 'sqlite3',
  connection: {
    filename: './tmp/db.sqlite3'
  },
  useNullAsDefault: true
};

module.exports = {
  development: config,
  test: config
};
