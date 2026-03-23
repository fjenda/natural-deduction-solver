import type { Solution } from '../Solution';
import type { TreeRuleType } from '../../../types/TreeRuleType';
import { NDRule } from '../../rules/DeductionRule';
import { get } from 'svelte/store';
import { theorems } from '../../../stores/theoremsStore';

function formulaToLatexInline(formula: string): string {
	return formula
		.replace(/¬/g, '\\neg ')
		.replace(/∧/g, '\\land ')
		.replace(/∨/g, '\\lor ')
		.replace(/⊃/g, '\\supset ')
		.replace(/→/g, '\\supset ')
		.replace(/≡/g, '\\equiv ')
		.replace(/↔/g, '\\leftrightarrow ')
		.replace(/∀/g, '\\forall ')
		.replace(/∃/g, '\\exists ')
		.replace(/\[/g, '(')
		.replace(/]/g, ')');
}

function escapeLatexText(text: string): string {
	return text
		.replace(/([#$%&_{}])/g, '\\$1')
		.replace(/~/g, '\\textasciitilde{}')
		.replace(/\^/g, '\\textasciicircum{}');
}

function formulaToLatexDisplay(formula: string): string {
	return `$${formulaToLatexInline(formula)}$`;
}

function formulaToTxt(formula: string): string {
	return formula;
}

function getRuleNameTxt(ruleStr: string): string {
	const rule = NDRule[ruleStr as keyof typeof NDRule];
	if (rule) {
		switch (rule) {
			case NDRule.ICON:
				return '∧I';
			case NDRule.ECON:
				return '∧E';
			case NDRule.IDIS:
				return '∨I';
			case NDRule.EDIS:
				return '∨E';
			case NDRule.IIMP:
				return '→I';
			case NDRule.MP:
				return '→E';
			case NDRule.IEQ:
				return '↔I';
			case NDRule.EEQ:
				return '↔E';
			case NDRule.IALL:
				return '∀I';
			case NDRule.EALL:
				return '∀E';
			case NDRule.IEX:
				return '∃I';
			case NDRule.EEX:
				return '∃E';
			case NDRule.PREM:
				return 'Premise';
			case NDRule.CONC:
				return 'Conclusion';
			default:
				return ruleStr;
		}
	}
	return ruleStr;
}

function getRuleNameLatex(ruleStr: string): string {
	const rule = NDRule[ruleStr as keyof typeof NDRule];
	if (!rule) {
		return `\\text{${escapeLatexText(ruleStr)}}`;
	}

	switch (rule) {
		case NDRule.ICON:
			return '\\land I';
		case NDRule.ECON:
			return '\\land E';
		case NDRule.IDIS:
			return '\\lor I';
		case NDRule.EDIS:
			return '\\lor E';
		case NDRule.IIMP:
			return '\\to I';
		case NDRule.MP:
			return '\\to E';
		case NDRule.IEQ:
			return '\\leftrightarrow I';
		case NDRule.EEQ:
			return '\\leftrightarrow E';
		case NDRule.IALL:
			return '\\forall I';
		case NDRule.EALL:
			return '\\forall E';
		case NDRule.IEX:
			return '\\exists I';
		case NDRule.EEX:
			return '\\exists E';
		case NDRule.PREM:
			return '\\text{Premise}';
		case NDRule.CONC:
			return '\\text{Conclusion}';
		default:
			return `\\text{${escapeLatexText(ruleStr)}}`;
	}
}

function getUsedTheorems(proof: TreeRuleType[]): string[] {
	const allTheorems = get(theorems);
	const usedTheoremNames = new Set<string>();

	for (const row of proof) {
		const ruleStr = row.rule.rule;
		if (ruleStr === 'x' || ruleStr === 'UNKNOWN') continue;
		if (NDRule[ruleStr as keyof typeof NDRule]) continue;
		usedTheoremNames.add(ruleStr);
	}

	const result: string[] = [];
	for (const theorem of allTheorems) {
		if (usedTheoremNames.has(theorem.solution.name)) {
			result.push(theorem.solution.name);
		}
	}
	return result;
}

function buildProofTree(proof: TreeRuleType[]): {
	lines: string[];
	latex: string[];
	txt: string[];
} {
	const latexLines: string[] = [];
	const txtLines: string[] = [];

	for (let i = 0; i < proof.length; i++) {
		const row = proof[i];
		if (!row.tree) continue;

		const lineNum = row.line;
		const formulaLatex = formulaToLatexInline(row.value);
		const formulaTxt = formulaToTxt(row.value);
		const ruleStr = row.rule.rule;
		const ruleNameTxt = getRuleNameTxt(ruleStr);
		const ruleNameLatex = getRuleNameLatex(ruleStr);
		// const ruleNameTxt = ruleStr;
		// const ruleNameLatex = ruleStr;
		const inputLines = row.rule.lines || [];

		let justificationTxt = ruleNameTxt;
		if (inputLines.length > 0) {
			justificationTxt += ` ${inputLines.join(',')}`;
		}

		let justificationLatex = ruleNameLatex;
		if (inputLines.length > 0) {
			justificationLatex += `\\;${inputLines.join(',')}`;
		}

		latexLines.push(`${lineNum}. & $${formulaLatex}$ & ${justificationLatex}`);
		txtLines.push(`${lineNum}. ${formulaTxt.padEnd(30)} ${justificationTxt}`);
	}

	return { lines: [], latex: latexLines, txt: txtLines };
}

export function exportToLatex(solution: Solution): string {
	const { proof, premises, conclusion } = solution;
	const usedTheoremNames = getUsedTheorems(proof);

	const latexPreamble = `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{array}
\\newcolumntype{L}{>{\\arraybackslash}m{4in}}

\\EnableBpAbbreviations

\\begin{document}

\\section*{Proof}`;

	const premisesSection = premises
		.map((p) => `\\item ${formulaToLatexDisplay(p.value)}`)
		.join('\n');

	const header = `\\textbf{Premises:}%
\\begin{itemize}
${premisesSection}
\\end{itemize}

\\textbf{Conclusion:} ${formulaToLatexDisplay(conclusion.value)}`;

	let theoremsSection = '';
	if (usedTheoremNames.length > 0) {
		const allTheorems = get(theorems);
		const theoremItems = usedTheoremNames
			.map((name) => {
				const theorem = allTheorems.find((t) => t.solution.name === name);
				if (!theorem) return '';
				const thm = theorem.solution;
				const thmPremises = thm.premises.map((p) => formulaToLatexInline(p.value)).join(', ');
				const thmConclusion = formulaToLatexInline(thm.conclusion.value);

				const thmProofBody = buildProofTree(thm.proof);
				let thmProofTable = '';
				if (thmProofBody.latex.length > 0) {
					const rows = thmProofBody.latex.join('\\\\\n');
					thmProofTable = `
\\begin{center}
\\begin{tabular}{cLl}
\\text{Line} & \\text{Formula} & \\text{Justification} \\\\
\\hline
${rows}\\\\
\\hline
\\end{tabular}
\\end{center}`;
				}

				return `\\paragraph{${escapeLatexText(name)}:} $${thmPremises} \\vdash ${thmConclusion}$ ${thmProofTable}`;
			})
			.filter(Boolean)
			.join('\n\n');

		theoremsSection = `\\paragraph{Used Theorems:}\n${theoremItems}`;
	}

	const proofBody = buildProofTree(proof);

	let proofEnvironment = '';
	if (proofBody.latex.length > 0) {
		const rows = proofBody.latex.join('\\\\\n');
		proofEnvironment = `
\\begin{center}
\\begin{tabular}{cLl}
\\text{Line} & \\text{Formula} & \\text{Justification} \\\\
\\hline
${rows}\\\\
\\hline
\\end{tabular}
\\end{center}`;
	}

	const footer = '\\end{document}';

	return `${latexPreamble}

${header}

${theoremsSection}

${proofEnvironment}

${footer}`;
}

export function exportToTxt(solution: Solution): string {
	const { proof, premises, conclusion } = solution;
	const usedTheoremNames = getUsedTheorems(proof);

	const divider = '='.repeat(60);
	const premisesSection = premises.map((p, i) => `${i + 1}. ${p.value}`).join('\n');

	let theoremsSection = '';
	if (usedTheoremNames.length > 0) {
		const allTheorems = get(theorems);
		const theoremBlocks = usedTheoremNames
			.map((name) => {
				const theorem = allTheorems.find((t) => t.solution.name === name);
				if (!theorem) return '';
				const thm = theorem.solution;
				const thmPremises = thm.premises.map((p) => p.value).join(', ');
				const thmConclusion = thm.conclusion.value;

				const thmProofBody = buildProofTree(thm.proof);
				const thmProofLines = thmProofBody.txt.join('\n');

				return `${name}: ${thmPremises} ⊢ ${thmConclusion}
${thmProofLines}`;
			})
			.filter(Boolean)
			.join('\n\n');

		theoremsSection = `USED THEOREMS:
${theoremBlocks}

`;
	}

	const header = `${divider}
NATURAL DEDUCTION PROOF
${divider}

PREMISES:
${premisesSection}

CONCLUSION:
${conclusion.value}

${theoremsSection}${divider}
PROOF:
${divider}
`;

	const proofBody = buildProofTree(proof);
	const proofSection = proofBody.txt.join('\n');

	const footer = `\n${divider}
Proof complete.
${divider}`;

	return `${header}${proofSection}${footer}`;
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function copyToClipboard(text: string): Promise<void> {
	return navigator.clipboard.writeText(text);
}
