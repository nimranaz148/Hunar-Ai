/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EarningsTransaction } from './EarningsTransaction';
import type { MonthlyEarningSummary } from './MonthlyEarningSummary';

export type MentorEarningsResponse = {
    /** Total PKR released from escrow */
    total_earned_pkr: number;
    /** PKR currently held in simulated escrow for booked sessions */
    pending_escrow_pkr: number;
    /** PKR returned to entrepreneurs via refunds */
    total_refunded_pkr: number;
    completed_sessions_count: number;
    average_session_fee_pkr: number;
    /** all | this_month | last_month | this_year */
    period: string;
    /** Human-readable period label e.g. "October 2026" */
    period_label: string;
    /** Monthly trend breakdown ordered ascending */
    monthly_trend: Array<MonthlyEarningSummary>;
    /** Full transaction ledger */
    transactions: Array<EarningsTransaction>;
};
