import type { EndpointResult } from "./EndpointResult";

/**
 * ProveResult
 * A type that gets returned from an API call to the prove endpoint.
 */
export interface ProveResult extends EndpointResult {
    // success: boolean;
    // results?: string[];
    // message?: string;
}

export interface ProveRequest {
    premises: string[];
    conclusion: string;
    rule: string;
}