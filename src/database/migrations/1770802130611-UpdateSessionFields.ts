import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSessionFields1770802130611 implements MigrationInterface {
  name = 'UpdateSessionFields1770802130611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "session" ADD "deviceName" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD "deviceType" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD "appVersion" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD "country" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "session" ADD "city" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "session" ADD "lastUsedAt" TIMESTAMP`);
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
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "lastUsedAt"`);
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "city"`);
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "country"`);
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "appVersion"`);
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "deviceType"`);
    await queryRunner.query(`ALTER TABLE "session" DROP COLUMN "deviceName"`);
  }
}
