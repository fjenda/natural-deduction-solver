import type { Solution } from '../Solution';
import type { TreeRuleType } from '../../../types/TreeRuleType';
import { NDRule } from '../../rules/DeductionRule';
import { get } from 'svelte/store';
import { theorems } from '../../../stores/theoremsStore';

const SYMBOL_TO_LATEX: Record<string, string> = {
	'¬': '\\neg ',
	'∧': '\\land ',
	'∨': '\\lor ',
	'⊃': '\\supset ',
	'→': '\\supset ',
	'≡': '\\equiv ',
	'↔': '\\leftrightarrow ',
	'∀': '\\forall ',
	'∃': '\\exists ',
	'[': '(',
	']': ')'
};

const SYMBOL_PATTERN = new RegExp(
	`[${Object.keys(SYMBOL_TO_LATEX).map(escapeRegex).join('')}]`,
	'g'
);

function escapeRegex(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formulaToLatex(formula: string): string {
	return formula.replace(SYMBOL_PATTERN, (c) => SYMBOL_TO_LATEX[c]);
}

function escapeLatexText(text: string): string {
	return text
		.replace(/([#$%&_{}])/g, '\\$1')
		.replace(/~/g, '\\textasciitilde{}')
		.replace(/\^/g, '\\textasciicircum{}');
}

const RULE_NAMES: Record<string, { txt: string; tex: string }> = {
	IC: { txt: '∧I', tex: '\\land I' },
	EC: { txt: '∧E', tex: '\\land E' },
	ID: { txt: '∨I', tex: '\\lor I' },
	ED: { txt: '∨E', tex: '\\lor E' },
	II: { txt: '→I', tex: '\\to I' },
	MP: { txt: '→E', tex: '\\to E' },
	IE: { txt: '↔I', tex: '\\leftrightarrow I' },
	EE: { txt: '↔E', tex: '\\leftrightarrow E' },
	IU: { txt: '∀I', tex: '\\forall I' },
	EU: { txt: '∀E', tex: '\\forall E' },
	IEX: { txt: '∃I', tex: '\\exists I' },
	EEX: { txt: '∃E', tex: '\\exists E' },
	PREM: { txt: 'Premise', tex: '\\text{Premise}' },
	CONC: { txt: 'Indirect Premise', tex: '\\text{Indirect Premise}' }
};

function getRuleName(ruleStr: string): { txt: string; tex: string } {
	return (
		RULE_NAMES[ruleStr] ?? {
			txt: ruleStr,
			tex: `\\text{${escapeLatexText(ruleStr)}}`
		}
	);
}

function getUsedTheorems(proof: TreeRuleType[]): string[] {
	const allTheorems = get(theorems);
	const used = new Set<string>();

	for (const row of proof) {
		const ruleStr = row.rule.rule;
		if (ruleStr === 'x' || ruleStr === 'UNKNOWN') continue;
		if (NDRule[ruleStr as keyof typeof NDRule]) continue;
		used.add(ruleStr);
	}

	return allTheorems.filter((t) => used.has(t.solution.name)).map((t) => t.solution.name);
}

function findContradictionLines(proof: TreeRuleType[]): [number, number] | null {
	const rows = proof.filter((r) => r.tree);
	for (let i = 0; i < rows.length; i++) {
		for (let j = i + 1; j < rows.length; j++) {
			if (rows[i].tree!.equals(rows[j].tree!.negate())) {
				return [rows[i].line, rows[j].line];
			}
		}
	}
	return null;
}

function buildProofLines(proof: TreeRuleType[]): { latex: string[]; txt: string[] } {
	const latex: string[] = [];
	const txt: string[] = [];

	for (const row of proof) {
		if (!row.tree) continue;

		const ruleName = getRuleName(row.rule.rule);
		const refs = row.rule.lines || [];
		const refStr = refs.length > 0 ? refs.join(',') : '';

		latex.push(
			`${row.line}. & $${formulaToLatex(row.value)}$ & ${ruleName.tex}${refStr ? `\\;${refStr}` : ''}`
		);
		txt.push(`${row.line}. ${row.value.padEnd(30)} ${ruleName.txt}${refStr ? ` ${refStr}` : ''}`);
	}

	return { latex, txt };
}

function buildLatexProofTable(lines: string[]): string {
	if (lines.length === 0) return '';
	return `\\begin{center}
\\begin{tabular}{cLl}
\\text{Line} & \\text{Formula} & \\text{Justification} \\\\
\\hline
${lines.join('\\\\\n')}\\\\
\\hline
\\end{tabular}
\\end{center}`;
}

function buildTheoremLatex(name: string): string {
	const allTheorems = get(theorems);
	const theorem = allTheorems.find((t) => t.solution.name === name);
	if (!theorem) return '';

	const thm = theorem.solution;
	const premises = thm.premises.map((p) => formulaToLatex(p.value)).join(', ');
	const conclusion = formulaToLatex(thm.conclusion.value);
	const { latex } = buildProofLines(thm.proof);

	return `\\paragraph{${escapeLatexText(name)}:} $${premises} \\vdash ${conclusion}$ ${buildLatexProofTable(latex)}`;
}

function buildTheoremTxt(name: string): string {
	const allTheorems = get(theorems);
	const theorem = allTheorems.find((t) => t.solution.name === name);
	if (!theorem) return '';

	const thm = theorem.solution;
	const premises = thm.premises.map((p) => p.value).join(', ');
	const conclusion = thm.conclusion.value;
	const { txt } = buildProofLines(thm.proof);

	return `${name}: ${premises} ⊢ ${conclusion}\n${txt.join('\n')}`;
}

export function exportToLatex(solution: Solution): string {
	const { proof, premises, conclusion } = solution;
	const usedTheoremNames = getUsedTheorems(proof);

	const premisesList = premises.map((p) => `\\item $${formulaToLatex(p.value)}$`).join('\n');

	const { latex: proofLines } = buildProofLines(proof);

	let theoremsSection = '';
	if (usedTheoremNames.length > 0) {
		const items = usedTheoremNames.map(buildTheoremLatex).filter(Boolean).join('\n\n');
		theoremsSection = `\\paragraph{Used Theorems:}\n${items}`;
	}

	const proofType = solution.indirect
		? '\\textbf{Proof Type:} Indirect (Reductio ad Absurdum)\n\n'
		: '';

	const statusLine = solution.valid && solution.proofComplete
		? '\\textbf{Status:} Proof complete.\n\n'
		: solution.proofReached
			? solution.indirect
				? '\\textbf{Status:} Contradiction reached, but the proof is not complete because the contradiction is not closed on the last row.\n\n'
				: '\\textbf{Status:} Conclusion reached, but the proof is not complete because the conclusion is not the last row.\n\n'
			: '\\textbf{Status:} Proof incomplete.\n\n';

	let contradictionLine = '';
	if (solution.indirect && solution.proofReached) {
		const pair = solution.contradictionPairLines ?? findContradictionLines(proof);
		if (pair) {
			contradictionLine = `\\textbf{Contradiction:} Lines ${pair[0]} and ${pair[1]}\n\n`;
		}
	}

	return `\\documentclass[12pt]{article}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{array}
\\newcolumntype{L}{>{\\arraybackslash}m{4in}}

\\begin{document}

\\section*{Proof}

${proofType}${statusLine}${contradictionLine}\\textbf{Premises:}%
\\begin{itemize}
${premisesList}
\\end{itemize}

\\textbf{Conclusion:} $${formulaToLatex(conclusion.value)}$

${theoremsSection}

${buildLatexProofTable(proofLines)}

\\end{document}`;
}

export function exportToTxt(solution: Solution): string {
	const { proof, premises, conclusion } = solution;
	const usedTheoremNames = getUsedTheorems(proof);
	const divider = '='.repeat(60);

	const premisesList = premises.map((p, i) => `${i + 1}. ${p.value}`).join('\n');

	let theoremsSection = '';
	if (usedTheoremNames.length > 0) {
		const blocks = usedTheoremNames.map(buildTheoremTxt).filter(Boolean).join('\n\n');
		theoremsSection = `USED THEOREMS:\n${blocks}\n\n`;
	}

	const { txt: proofLines } = buildProofLines(proof);

	const proofType = solution.indirect ? 'Proof Type: Indirect (Reductio ad Absurdum)\n\n' : '';

	const statusLine = solution.valid && solution.proofComplete
		? 'Status: Proof complete.'
		: solution.proofReached
			? solution.indirect
				? 'Status: Contradiction reached, but the proof is not complete because the contradiction is not closed on the last row.'
				: 'Status: Conclusion reached, but the proof is not complete because the conclusion is not the last row.'
			: 'Status: Proof incomplete.';

	let contradictionLine = '';
	if (solution.indirect && solution.proofReached) {
		const pair = solution.contradictionPairLines ?? findContradictionLines(proof);
		if (pair) {
			contradictionLine = `\nContradiction: Lines ${pair[0]} and ${pair[1]}`;
		}
	}

	return `${divider}
NATURAL DEDUCTION PROOF
${divider}

${proofType}PREMISES:
${premisesList}

CONCLUSION:
${conclusion.value}

${theoremsSection}${divider}
PROOF:
${divider}
${proofLines.join('\n')}

${divider}
${statusLine}${contradictionLine}
${divider}`;
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
