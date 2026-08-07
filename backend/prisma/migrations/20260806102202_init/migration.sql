-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'SUB_ADMIN', 'MEMBER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'CALCULATED', 'DISBURSED', 'CANCELLED', 'HOLD');

-- CreateEnum
CREATE TYPE "DistributionBatchStatus" AS ENUM ('INITIATED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DistributionRecordStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'HOLD');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('UPI', 'BANK_TRANSFER', 'WALLET', 'CASH', 'MANUAL');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "member_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "referrer_id" TEXT,
    "joining_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upi_id" TEXT,
    "bank_details" JSONB,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "password_hash" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repurchase_entries" (
    "id" TEXT NOT NULL,
    "transaction_ref" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repurchase_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_commission_ledger" (
    "id" TEXT NOT NULL,
    "source_member_id" TEXT NOT NULL,
    "beneficiary_member_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "distribution_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_commission_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repurchase_commission_ledger" (
    "id" TEXT NOT NULL,
    "repurchase_entry_id" TEXT NOT NULL,
    "source_member_id" TEXT NOT NULL,
    "beneficiary_member_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "distribution_record_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "repurchase_commission_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_batches" (
    "id" TEXT NOT NULL,
    "batch_no" TEXT NOT NULL,
    "total_members" INTEGER NOT NULL DEFAULT 0,
    "total_gross_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_tds_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_admin_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_net_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "DistributionBatchStatus" NOT NULL DEFAULT 'INITIATED',
    "processed_by" TEXT,
    "remarks" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribution_records" (
    "id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "commission_type" TEXT,
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "tds_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "admin_fee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(12,2) NOT NULL,
    "payment_mode" "PaymentMode" NOT NULL DEFAULT 'UPI',
    "payment_ref" TEXT,
    "bank_details" JSONB,
    "status" "DistributionRecordStatus" NOT NULL DEFAULT 'PENDING',
    "disbursed_at" TIMESTAMP(3),
    "failure_reason" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distribution_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_role" "MemberRole",
    "action_type" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "members_member_code_key" ON "members"("member_code");

-- CreateIndex
CREATE UNIQUE INDEX "members_mobile_key" ON "members"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE INDEX "members_referrer_id_idx" ON "members"("referrer_id");

-- CreateIndex
CREATE INDEX "members_referrer_id_status_idx" ON "members"("referrer_id", "status");

-- CreateIndex
CREATE INDEX "members_member_code_idx" ON "members"("member_code");

-- CreateIndex
CREATE INDEX "members_mobile_idx" ON "members"("mobile");

-- CreateIndex
CREATE INDEX "members_status_idx" ON "members"("status");

-- CreateIndex
CREATE INDEX "members_joining_date_idx" ON "members"("joining_date");

-- CreateIndex
CREATE UNIQUE INDEX "repurchase_entries_transaction_ref_key" ON "repurchase_entries"("transaction_ref");

-- CreateIndex
CREATE INDEX "repurchase_entries_member_id_idx" ON "repurchase_entries"("member_id");

-- CreateIndex
CREATE INDEX "repurchase_entries_member_id_transaction_date_idx" ON "repurchase_entries"("member_id", "transaction_date");

-- CreateIndex
CREATE INDEX "repurchase_entries_transaction_ref_idx" ON "repurchase_entries"("transaction_ref");

-- CreateIndex
CREATE INDEX "repurchase_entries_transaction_date_idx" ON "repurchase_entries"("transaction_date");

-- CreateIndex
CREATE INDEX "repurchase_entries_created_by_idx" ON "repurchase_entries"("created_by");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_source_member_id_idx" ON "membership_commission_ledger"("source_member_id");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_beneficiary_member_id_idx" ON "membership_commission_ledger"("beneficiary_member_id");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_beneficiary_member_id_status_idx" ON "membership_commission_ledger"("beneficiary_member_id", "status");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_beneficiary_member_id_created__idx" ON "membership_commission_ledger"("beneficiary_member_id", "created_at");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_status_idx" ON "membership_commission_ledger"("status");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_level_idx" ON "membership_commission_ledger"("level");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_distribution_record_id_idx" ON "membership_commission_ledger"("distribution_record_id");

-- CreateIndex
CREATE INDEX "membership_commission_ledger_created_at_idx" ON "membership_commission_ledger"("created_at");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_repurchase_entry_id_idx" ON "repurchase_commission_ledger"("repurchase_entry_id");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_source_member_id_idx" ON "repurchase_commission_ledger"("source_member_id");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_beneficiary_member_id_idx" ON "repurchase_commission_ledger"("beneficiary_member_id");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_beneficiary_member_id_status_idx" ON "repurchase_commission_ledger"("beneficiary_member_id", "status");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_beneficiary_member_id_created__idx" ON "repurchase_commission_ledger"("beneficiary_member_id", "created_at");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_status_idx" ON "repurchase_commission_ledger"("status");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_level_idx" ON "repurchase_commission_ledger"("level");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_distribution_record_id_idx" ON "repurchase_commission_ledger"("distribution_record_id");

-- CreateIndex
CREATE INDEX "repurchase_commission_ledger_created_at_idx" ON "repurchase_commission_ledger"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "repurchase_commission_ledger_repurchase_entry_id_beneficiar_key" ON "repurchase_commission_ledger"("repurchase_entry_id", "beneficiary_member_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "distribution_batches_batch_no_key" ON "distribution_batches"("batch_no");

-- CreateIndex
CREATE INDEX "distribution_batches_batch_no_idx" ON "distribution_batches"("batch_no");

-- CreateIndex
CREATE INDEX "distribution_batches_status_idx" ON "distribution_batches"("status");

-- CreateIndex
CREATE INDEX "distribution_batches_processed_by_idx" ON "distribution_batches"("processed_by");

-- CreateIndex
CREATE INDEX "distribution_batches_created_at_idx" ON "distribution_batches"("created_at");

-- CreateIndex
CREATE INDEX "distribution_records_batch_id_idx" ON "distribution_records"("batch_id");

-- CreateIndex
CREATE INDEX "distribution_records_member_id_idx" ON "distribution_records"("member_id");

-- CreateIndex
CREATE INDEX "distribution_records_status_idx" ON "distribution_records"("status");

-- CreateIndex
CREATE INDEX "distribution_records_payment_mode_idx" ON "distribution_records"("payment_mode");

-- CreateIndex
CREATE INDEX "distribution_records_created_at_idx" ON "distribution_records"("created_at");

-- CreateIndex
CREATE INDEX "activity_logs_actor_id_idx" ON "activity_logs"("actor_id");

-- CreateIndex
CREATE INDEX "activity_logs_action_type_idx" ON "activity_logs"("action_type");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_entries" ADD CONSTRAINT "repurchase_entries_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_entries" ADD CONSTRAINT "repurchase_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_commission_ledger" ADD CONSTRAINT "membership_commission_ledger_source_member_id_fkey" FOREIGN KEY ("source_member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_commission_ledger" ADD CONSTRAINT "membership_commission_ledger_beneficiary_member_id_fkey" FOREIGN KEY ("beneficiary_member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_commission_ledger" ADD CONSTRAINT "membership_commission_ledger_distribution_record_id_fkey" FOREIGN KEY ("distribution_record_id") REFERENCES "distribution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_commission_ledger" ADD CONSTRAINT "repurchase_commission_ledger_repurchase_entry_id_fkey" FOREIGN KEY ("repurchase_entry_id") REFERENCES "repurchase_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_commission_ledger" ADD CONSTRAINT "repurchase_commission_ledger_source_member_id_fkey" FOREIGN KEY ("source_member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_commission_ledger" ADD CONSTRAINT "repurchase_commission_ledger_beneficiary_member_id_fkey" FOREIGN KEY ("beneficiary_member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repurchase_commission_ledger" ADD CONSTRAINT "repurchase_commission_ledger_distribution_record_id_fkey" FOREIGN KEY ("distribution_record_id") REFERENCES "distribution_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_batches" ADD CONSTRAINT "distribution_batches_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_records" ADD CONSTRAINT "distribution_records_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "distribution_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribution_records" ADD CONSTRAINT "distribution_records_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
