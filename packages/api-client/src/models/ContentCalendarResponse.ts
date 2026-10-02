/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DayBriefItem } from './DayBriefItem';
import type { PillarItem } from './PillarItem';
import type { WeeklyThemeItem } from './WeeklyThemeItem';
/**
 * Content calendar outline response.
 */
export type ContentCalendarResponse = {
    id: string;
    business_id: string;
    status: string;
    pillars?: Array<PillarItem>;
    weekly_themes?: Array<WeeklyThemeItem>;
    format_distribution?: Record<string, any>;
    day_briefs?: Array<DayBriefItem>;
    revision_notes?: (string | null);
    approved_at?: (string | null);
    created_at?: (string | null);
    updated_at?: (string | null);
};

