/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MenteeBookingSummary } from './MenteeBookingSummary';
import type { MenteeBriefData } from './MenteeBriefData';
import type { MenteeTaskSummary } from './MenteeTaskSummary';
/**
 * Comprehensive Mentee Detail and Brief report for a mentor (F-025).
 */
export type MenteeDetailResponse = {
    entrepreneur_id: string;
    name: string;
    email: string;
    business_id?: (string | null);
    business_name?: (string | null);
    niche?: (string | null);
    city?: (string | null);
    area?: (string | null);
    budget_pkr?: (number | null);
    hours_per_week?: (number | null);
    tone?: (string | null);
    languages?: Array<string>;
    platforms?: Array<string>;
    target_customer?: (string | null);
    validation_confidence?: (string | null);
    competitor_gap?: (string | null);
    products_count?: number;
    plan_status?: (string | null);
    tasks_total?: number;
    tasks_completed?: number;
    completion_rate?: number;
    recent_tasks?: Array<MenteeTaskSummary>;
    content_items_total?: number;
    content_items_posted?: number;
    session_history?: Array<MenteeBookingSummary>;
    mentor_brief: MenteeBriefData;
};

