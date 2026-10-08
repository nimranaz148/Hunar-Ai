/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { CohortProgramSummary } from './CohortProgramSummary';
import type { StalledBusinessItem } from './StalledBusinessItem';
import type { StalledSummaryCounts } from './StalledSummaryCounts';

export type StalledListResponse = {
    items: Array<StalledBusinessItem>;
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    summary: StalledSummaryCounts;
    programs: Array<CohortProgramSummary>;
};
