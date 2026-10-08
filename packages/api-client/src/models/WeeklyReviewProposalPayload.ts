/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProposedContentAdjustment } from './ProposedContentAdjustment';
import type { WeeklyReviewDiagnosis } from './WeeklyReviewDiagnosis';

export type WeeklyReviewProposalPayload = {
    diagnosis: WeeklyReviewDiagnosis;
    coach_rationale: string;
    proposed_adjustments?: Array<ProposedContentAdjustment>;
    mentor_recommendation?: (string | null);
};
