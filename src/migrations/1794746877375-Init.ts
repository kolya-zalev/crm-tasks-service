import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1794746877375 implements MigrationInterface {
    name = 'Init1794746877375'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "Task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "leadId" text NOT NULL, "title" text NOT NULL, "description" text, "status" text NOT NULL DEFAULT 'pending', "priority" text NOT NULL DEFAULT 'medium', "dueDate" TIMESTAMP WITH TIME ZONE NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_95d9364b8115119ba8b15a43592" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_cae5a53b9acbfcb8a89f42ee12" ON "Task" ("leadId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_cae5a53b9acbfcb8a89f42ee12"`);
        await queryRunner.query(`DROP TABLE "Task"`);
    }

}
