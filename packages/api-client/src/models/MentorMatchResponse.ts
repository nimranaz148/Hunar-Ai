/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MentorMatchItem } from './MentorMatchItem';
export type MentorMatchResponse = {
    source: MentorMatchResponse.source;
    items: Array<MentorMatchItem>;
};
export namespace MentorMatchResponse {
    export enum source {
        AI = 'ai',
        RULES = 'rules',
    }
}

