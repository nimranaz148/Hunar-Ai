/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Admin view of a system feature flag.
 */
export type FeatureFlagResponse = {
    /**
     * Unique technical identifier for the flag
     */
    key: string;
    /**
     * Human-readable title
     */
    name: string;
    /**
     * Detailed explanation of functionality controlled
     */
    description: string;
    /**
     * Whether the feature is currently active
     */
    is_enabled: boolean;
    /**
     * Last modification timestamp
     */
    updated_at?: (string | null);
    /**
     * Admin user who last modified flag
     */
    updated_by?: (string | null);
};

