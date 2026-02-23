import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStrigaUserDateOfBirth1771700000000
  implements MigrationInterface
{
  name = 'AddStrigaUserDateOfBirth1771700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "striga_user" ADD "dateOfBirth" jsonb DEFAULT null`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "striga_user" DROP COLUMN "dateOfBirth"`,
    );
  }
}
