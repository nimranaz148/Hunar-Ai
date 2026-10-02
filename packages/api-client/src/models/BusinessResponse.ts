/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Business profile details response.
 */
export type BusinessResponse = {
    id: string;
    owner_id: string;
    program_id?: (string | null);
    name: string;
    niche: string;
    city: string;
    area?: (string | null);
    budget_pkr: number;
    hours_per_week: number;
    tone: string;
    languages: Array<string>;
    platforms: Array<string>;
    target_customer?: (string | null);
    created_at?: string;
    updated_at?: (string | null);
};

