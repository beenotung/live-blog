import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `blog_post` add column `create_time` integer null')
  await knex.raw('alter table `blog_post` add column `publish_time` integer null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `blog_post` drop column `publish_time`')
  await knex.raw('alter table `blog_post` drop column `create_time`')
}
