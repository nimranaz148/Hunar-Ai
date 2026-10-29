/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CohortFunnelData } from './CohortFunnelData';
import type { CohortKPIs } from './CohortKPIs';
import type { CohortProgramSummary } from './CohortProgramSummary';
import type { StalledBusinessItem } from './StalledBusinessItem';
/**
 * Complete aggregated cohort performance and stalled monitoring response.
 */
export type CohortDashboardResponse = {
    program_id?: (string | null);
    program_name?: (string | null);
    funnel: CohortFunnelData;
    kpis: CohortKPIs;
    stalled_preview?: Array<StalledBusinessItem>;
    programs?: Array<CohortProgramSummary>;
};

