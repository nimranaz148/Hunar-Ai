/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CostInput } from './CostInput';
/**
 * Product response schema.
 */
export type ProductResponse = {
    id: string;
    business_id: string;
    name: string;
    description?: (string | null);
    cost_inputs: Array<CostInput>;
    price_pkr: number;
    created_at?: string;
    updated_at?: (string | null);
};

