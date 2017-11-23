exports.up = function(knex) {
  return knex.schema.createTable('tests', t => {
    t.string('id', 255).primary().notNullable();
    t.string('name', 255);
    t.timestamp('created_at', true);
    t.timestamp('updated_at', true);
    t.timestamp('touched_at', true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tests');
};
