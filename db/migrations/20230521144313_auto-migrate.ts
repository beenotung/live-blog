import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {

  if (!(await knex.schema.hasTable('blog_post'))) {
    await knex.schema.createTable('blog_post', table => {
      table.increments('id')
      table.integer('user_id').unsigned().notNullable().references('user.id')
      table.text('title').notNullable()
      table.text('content').notNullable()
      table.timestamps(false, true)
    })
  }
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('blog_post')
}
