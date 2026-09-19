-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- Record the migration so future deploys do not try to run it again.
INSERT INTO "_prisma_migrations"
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text,
   '12dd4e4f25cba532f2b2825176208aafef1644659b723490eafbdd91d95fe18b',
   now(),
   '20260919035953_user_admin_and_deletion_requests',
   NULL, NULL, now(), 1)
ON CONFLICT DO NOTHING;
