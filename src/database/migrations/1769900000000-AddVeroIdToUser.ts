import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVeroIdToUser1769900000000 implements MigrationInterface {
  name = 'AddVeroIdToUser1769900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "veroId" character varying`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_user_vero_id" ON "user" ("veroId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_user_vero_id"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "veroId"`);
  }
}
