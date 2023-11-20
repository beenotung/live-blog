import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  await knex.raw('alter table `blog_post` add column `retract_time` integer null')
}


export async function down(knex: Knex): Promise<void> {
  await knex.raw('alter table `blog_post` drop column `retract_time`')
}
