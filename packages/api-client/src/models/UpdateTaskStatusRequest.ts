/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Request payload to change task status (F-009).
 */
export type UpdateTaskStatusRequest = {
    status: UpdateTaskStatusRequest.status;
};
export namespace UpdateTaskStatusRequest {
    export enum status {
        PENDING = 'pending',
        IN_PROGRESS = 'in_progress',
        COMPLETED = 'completed',
        SKIPPED = 'skipped',
    }
}

