/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ProposalDetailResponse = {
    id: string;
    business_id: string;
    run_id?: (string | null);
    gate_type: string;
    payload: Record<string, any>;
    status: 'pending' | 'approved' | 'rejected';
    rejection_reason?: (string | null);
    decided_at?: (string | null);
    created_at: string;
    updated_at?: (string | null);
};
