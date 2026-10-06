/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Full detail of a mentor's own service (PRD §5 F-022).
 */
export type MentorServiceResponse = {
    id: string;
    mentor_id: string;
    title: string;
    description: string;
    niche: string;
    type: string;
    price_pkr: number;
    duration_min: number;
    active: boolean;
    created_at: string;
    updated_at?: (string | null);
};

