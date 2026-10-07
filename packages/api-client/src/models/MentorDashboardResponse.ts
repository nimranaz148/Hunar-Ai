/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MentorDashboardSessionItem } from './MentorDashboardSessionItem';
import type { MentorReviewItem } from './MentorReviewItem';
/**
 * Consolidated Mentor Dashboard response (PRD §7 D-002, §8, §29.2).
 */
export type MentorDashboardResponse = {
    pending_requests_count: number;
    upcoming_sessions_count: number;
    total_earnings_pkr: number;
    average_rating: number;
    review_count: number;
    pending_requests: Array<MentorDashboardSessionItem>;
    upcoming_sessions: Array<MentorDashboardSessionItem>;
    recent_reviews: Array<MentorReviewItem>;
};

