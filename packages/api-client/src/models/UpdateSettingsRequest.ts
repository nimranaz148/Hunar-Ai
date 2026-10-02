/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request to update system operational settings.
 */
export type UpdateSettingsRequest = {
    agent_max_concurrent?: (number | null);
    agent_per_user_daily_limit?: (number | null);
    agent_kill_switch?: (boolean | null);
    rate_limit_per_minute?: (number | null);
};

