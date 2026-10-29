/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Hourly breakdown of agent workflow executions.
 */
export type HourlyRunStat = {
    /**
     * Hour label or ISO string, e.g. '14:00'
     */
    hour: string;
    /**
     * Total runs started in this hour
     */
    total?: number;
    /**
     * Succeeded runs in this hour
     */
    succeeded?: number;
    /**
     * Failed/blocked runs in this hour
     */
    failed?: number;
};

