import type {EndpointResult} from "./EndpointResult";

/**
 * SubstitutionResult
 * A type that gets returned from an API call to the substitution endpoint.
 */
export interface SubstitutionResult extends EndpointResult {
    // success: boolean;
    // results?: string[];
    // message?: string;
}

export interface SubstitutionRequest {
    formula: string;
    oldVars: string[];
    newVars: string[];
}