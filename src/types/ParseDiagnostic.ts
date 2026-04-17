export type ParseDiagnosticSeverity = 'warning' | 'error';

export type ParseDiagnostic = {
	message: string;
	severity: ParseDiagnosticSeverity;
	start: number;
	end: number;
	source: string;
	found?: string | null;
	expected?: string[];
};

