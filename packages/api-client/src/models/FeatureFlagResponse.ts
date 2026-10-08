export type FeatureFlagResponse = {
    key: string;
    name: string;
    description: string;
    is_enabled: boolean;
    updated_at?: string | null;
    updated_by?: string | null;
};
