/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type GuideResponse = {
    reply: string;
    /**
     * 'offline' means no AI key or the AI failed; the reply is a fixed notice.
     */
    mode: GuideResponse.mode;
    /**
     * Specialists that took over.
     */
    handoffs?: Array<string>;
    /**
     * Tools/agent-tools called.
     */
    tools_used?: Array<string>;
};
export namespace GuideResponse {
    /**
     * 'offline' means no AI key or the AI failed; the reply is a fixed notice.
     */
    export enum mode {
        LIVE = 'live',
        OFFLINE = 'offline',
    }
}

