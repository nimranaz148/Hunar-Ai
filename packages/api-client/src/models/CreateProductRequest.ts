/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CostInput } from './CostInput';
/**
 * Payload to create a product offering for a business (F-005).
 */
export type CreateProductRequest = {
    /**
     * Product or service name
     */
    name: string;
    description?: (string | null);
    /**
     * Array of itemized costs
     */
    cost_inputs?: Array<CostInput>;
    /**
     * Selling price in PKR
     */
    price_pkr: number;
};

