import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrigaCardExternalId1772230480272
  implements MigrationInterface
{
  name = 'AddStrigaCardExternalId1772230480272';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "striga_card" ADD "externalId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_card" ADD CONSTRAINT "UQ_f1d99d0ec7b55f54de6871a52a4" UNIQUE ("externalId")`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."account_status_enum" RENAME TO "account_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."account_status_enum" AS ENUM('active', 'deactivate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" TYPE "public"."account_status_enum" USING "status"::"text"::"public"."account_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."account_status_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."sleeves_transaction_type_enum" RENAME TO "sleeves_transaction_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sleeves_transaction_type_enum" AS ENUM('transferIn', 'transferOut')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" TYPE "public"."sleeves_transaction_type_enum" USING "type"::"text"::"public"."sleeves_transaction_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" SET DEFAULT 'transferIn'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."sleeves_transaction_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "internal_event" ALTER COLUMN "payload" SET DEFAULT '{}'::jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "internal_event" ALTER COLUMN "payload" SET DEFAULT '{}'`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sleeves_transaction_type_enum_old" AS ENUM('transferIn', 'transferOut')`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" TYPE "public"."sleeves_transaction_type_enum_old" USING "type"::"text"::"public"."sleeves_transaction_type_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sleeves_transaction" ALTER COLUMN "type" SET DEFAULT 'transferIn'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."sleeves_transaction_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."sleeves_transaction_type_enum_old" RENAME TO "sleeves_transaction_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."account_status_enum_old" AS ENUM('active', 'deactivate')`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" TYPE "public"."account_status_enum_old" USING "status"::"text"::"public"."account_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "account" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(`DROP TYPE "public"."account_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."account_status_enum_old" RENAME TO "account_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_card" DROP CONSTRAINT "UQ_f1d99d0ec7b55f54de6871a52a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_card" DROP COLUMN "externalId"`,
    );
  }
}
