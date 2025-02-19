/**
 * Interface for the result of an endpoint.
 */
export interface EndpointResult {
    success: boolean;
    results?: string[];
    message?: string;
}

export interface EndpointRequest {
    proof: string[];
}