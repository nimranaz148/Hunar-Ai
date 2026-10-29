/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Proposal response with human gate decision status and payload.
 */
export type ProposalDetailResponse = {
    id: string;
    business_id: string;
    run_id?: (string | null);
    gate_type: string;
    payload?: Record<string, any>;
    status: ProposalDetailResponse.status;
    rejection_reason?: (string | null);
    decided_at?: (string | null);
    created_at?: string;
    updated_at?: (string | null);
};
export namespace ProposalDetailResponse {
    export enum status {
        PENDING = 'pending',
        APPROVED = 'approved',
        REJECTED = 'rejected',
    }
}

