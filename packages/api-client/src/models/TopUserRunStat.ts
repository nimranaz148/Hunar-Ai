/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Top platform users by agent workflow volume.
 */
export type TopUserRunStat = {
    /**
     * User unique identifier
     */
    user_id: string;
    /**
     * User display name
     */
    name: string;
    /**
     * User email address
     */
    email: string;
    /**
     * User account role
     */
    role: string;
    /**
     * Total agent workflow runs executed
     */
    run_count?: number;
};

