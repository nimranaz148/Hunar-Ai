/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarningsTransaction } from './EarningsTransaction';
import type { MonthlyEarningSummary } from './MonthlyEarningSummary';
/**
 * Full mentor earnings report with KPIs, monthly trend, and transaction ledger (F-026 / R-006).
 */
export type MentorEarningsResponse = {
    total_earned_pkr: number;
    pending_escrow_pkr: number;
    total_refunded_pkr: number;
    completed_sessions_count: number;
    average_session_fee_pkr: number;
    period: string;
    period_label: string;
    monthly_trend: Array<MonthlyEarningSummary>;
    transactions: Array<EarningsTransaction>;
};

