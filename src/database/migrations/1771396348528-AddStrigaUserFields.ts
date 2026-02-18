import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrigaUserFields1771396348528 implements MigrationInterface {
  name = 'AddStrigaUserFields1771396348528';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "externalId" uuid NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD CONSTRAINT "UQ_4ab227da0c99b1e974f85acaae4" UNIQUE ("externalId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "lastName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "firstName" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "mobile" jsonb NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "address" jsonb NOT NULL`,
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
    await queryRunner.query(`ALTER TABLE "striga_user" DROP COLUMN "address"`);
    await queryRunner.query(`ALTER TABLE "striga_user" DROP COLUMN "mobile"`);
    await queryRunner.query(
      `ALTER TABLE "striga_user" DROP COLUMN "firstName"`,
    );
    await queryRunner.query(`ALTER TABLE "striga_user" DROP COLUMN "lastName"`);
    await queryRunner.query(`ALTER TABLE "striga_user" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "striga_user" DROP CONSTRAINT "UQ_4ab227da0c99b1e974f85acaae4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "striga_user" DROP COLUMN "externalId"`,
    );
  }
}
