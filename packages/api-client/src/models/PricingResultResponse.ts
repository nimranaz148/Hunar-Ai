/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Pricing calculation and unit economics report for a product.
 */
export type PricingResultResponse = {
    id: string;
    business_id: string;
    product_id?: (string | null);
    product_name: string;
    assumptions?: Record<string, any>;
    /**
     * Cost of goods sold / direct cost per unit in PKR
     */
    unit_cost: number;
    /**
     * Recommended selling price in PKR
     */
    price: number;
    /**
     * Gross profit margin percentage
     */
    margin_pct: number;
    /**
     * Units required per month to break even
     */
    break_even_units: number;
    /**
     * Automated risk flags
     */
    risk_flags?: Array<string>;
    /**
     * Strategic pricing guidance or recommendations
     */
    notes?: string;
    approved_at?: (string | null);
    created_at?: string;
    updated_at?: (string | null);
};

