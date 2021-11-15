import { Knex } from 'knex';

export class KnexJs {
  public static addCreatedAndUpdated(knex: Knex, table: Knex.CreateTableBuilder) {
    table
      .timestamp('createdDate')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP'))
      .index()
      .comment('Created date');
    table
      .timestamp('updatedDate')
      .notNullable()
      .defaultTo(knex.raw('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
      .index()
      .comment('Last updated date');
  }
}

export default KnexJs;
