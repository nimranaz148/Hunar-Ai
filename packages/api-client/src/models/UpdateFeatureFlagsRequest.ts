import type { FeatureFlagUpdateItem } from './FeatureFlagUpdateItem';

export type UpdateFeatureFlagsRequest = {
    flags: Array<FeatureFlagUpdateItem>;
};
