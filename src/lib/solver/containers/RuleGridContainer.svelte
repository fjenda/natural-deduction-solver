<script lang="ts">
	import {
		deductionRules,
		highlightedRows,
		selectedRows,
		solverContent
	} from '../../../stores/solverStore';
	import { solving } from '../../../stores/stateStore';
	import { lastHovered } from '../../../stores/lastHoveredStore';
	import RuleGridLayout from '../../layouts/RuleGridLayout.svelte';
	import RuleSlot from '../../rules/components/RuleSlot.svelte';
	import { get } from 'svelte/store';
	import { DeductionRule, NDRule } from '../../rules/DeductionRule';
	import { showToast } from '../../utils/showToast';
	import { modals } from 'svelte-modals';
	import ReplaceQuantifierVariableModal from '../../modals/ReplaceQuantifierVariableModal.svelte';
	import { NodeType } from '../../syntax-checker/NodeType';
	import InputModal from '../../modals/InputModal.svelte';
	import { PrettySyntaxer } from '../parsers/PrettySyntaxer';
	import { PremiseParser } from '../parsers/PremiseParser';
	import {
		getSuggestionsForTerm,
		proveProlog,
		provePrologLines,
		usable
	} from '../services/proofService';
	import type { TreeRuleType } from '../../../types/TreeRuleType';
	import PickTheoremVariantModal from '../../modals/PickTheoremVariantModal.svelte';

	const getProofAndSelection = () => {
		const proof = get(solverContent).proof;
		const selected = get(selectedRows);
		return { proof, selected };
	};

	const validateFormulaInput = (modalInput: HTMLInputElement) => {
		modalInput.value = PrettySyntaxer.clean(modalInput.value);
		const formula = PremiseParser.parsePremise(modalInput.value);

		// console.log(formula);
		if (!formula.tree) {
			showToast('Invalid formula', 'error');
			return null;
		}

		return formula;
	};

	const pickVariableToReplaceModal = (variables: string[] = []): Promise<string> => {
		return new Promise((resolve) => {
			const variableButtons = variables.map((variable) => ({
				text: variable,
				action: () => {
					resolve(variable);
					modals.closeAll();
				}
			}));

			modals.open(PickTheoremVariantModal, {
				title: 'Select the variable to replace',
				theoremVariantButtons: variableButtons
			});
		});
	};

	const openQuantifierModal = async (
		rule: DeductionRule,
		selected: number[],
		suggestedTerm: string,
		proof: TreeRuleType[],
		isElimination: boolean
	) => {
		const rowTree = proof[selected[0] - 1].tree;
		const variables = rowTree?.variables;

		let placeholder = isElimination ? rowTree?.children[1]?.value : [...(variables ?? [])][0];

		if (!placeholder) {
			return showToast('No variables found in the formula', 'error');
		}

		if (!isElimination && variables && variables.size > 1) {
			placeholder = await pickVariableToReplaceModal([...variables]);
		}

		const suggestions = await getSuggestionsForTerm(suggestedTerm);

		await modals.open(ReplaceQuantifierVariableModal, {
			title: isElimination ? 'Replace Variable in Quantifier' : 'Introduce Variable for Quantifier',
			row: proof[selected[0] - 1],
			placeholder,
			onConfirm: (modalInput: HTMLInputElement) => {
				const formula = validateFormulaInput(modalInput);
				if (!formula) return;

				if (isElimination && formula.tree!.type !== NodeType.CONSTANT) {
					return showToast('Invalid formula', 'error');
				}

				const extraArgs = isElimination
					? [rowTree!.children[1]!.toPrologFormat(), formula.tree!.toPrologFormat()]
					: [placeholder, formula.tree!.toPrologFormat()];

				provePrologLines(selected, rule, extraArgs).then(() => {
					selectedRows.set([]);
				});
			},
			suggestions
		});
	};

	const openFormulaInputModal = (
		title: string,
		content: string,
		onConfirm: (formula: string) => void
	) => {
		modals.open(InputModal, {
			title,
			content,
			placeholder: 'Enter the formula',
			onConfirm: (modalInput: HTMLInputElement) => {
				const formula = validateFormulaInput(modalInput);
				if (!formula) return;
				onConfirm(formula.tree!.toPrologFormat());
				selectedRows.set([]);
			}
		});
	};

	const onRuleClick = async (rule: DeductionRule): Promise<void> => {
		// get selected rows
		const { proof, selected } = getProofAndSelection();

		// if the user selected more rows than needed for the rule
		if (selected.length > rule.inputSize) {
			return showToast('Too many rows selected', 'warning');
		}

		// get the premises
		const premises: string[] = selected.map(
			(index) => proof[index - 1]?.tree?.toPrologFormat() ?? ''
		);

		if (selected.length === rule.inputSize) {
			if ([NDRule.EEX, NDRule.EALL].includes(rule.short)) {
				return openQuantifierModal(rule, selected, premises[0], proof, true);
			}

			if ([NDRule.IEX, NDRule.IALL].includes(rule.short)) {
				return openQuantifierModal(rule, selected, premises[0], proof, false);
			}

			await provePrologLines(selected, rule, []);
			selectedRows.set([]);
			return;
		}

		if (rule.short === NDRule.IDIS) {
			return openFormulaInputModal(
				'Insert Formula',
				'Write the formula to insert into the disjunction',
				(formula) => {
					premises.push(formula);
					proveProlog(premises, rule, selected, []);
				}
			);
		}

		// if the user selected fewer rows than needed for the rule
		await modals.open(InputModal, {
			title: 'Select row',
			content: 'Select the second row with which to execute the rule',
			placeholder: 'Enter the row number',
			onConfirm: (modalInput: HTMLInputElement) => {
				const other = parseInt(modalInput.value);
				if (isNaN(other) || other < 1 || other > proof.length) {
					return showToast('Invalid row number', 'error');
				}

				if (selected.includes(other)) {
					return showToast('Row already selected', 'warning');
				}

				selected.push(other);
				provePrologLines(selected, rule, []).then(() => {
					selectedRows.set([]);
				});
			}
		});
	};

	const onRuleMouseOver = async (rule: DeductionRule) => {
		if (!get(solving)) return;
		const selRows = get(selectedRows);
		if (selRows.length === 0 || selRows.length >= rule.inputSize) return;

		const last = get(lastHovered);
		if (last.rule === rule.title && last.selected === selRows) {
			highlightedRows.set(last.rows);
			return;
		}

		const rows = await usable(rule, selRows[0]);
		highlightedRows.set(rows.highlighted);
		lastHovered.set({ rule: rule.title, selected: selRows, rows: rows.highlighted });
	};

	function onRuleMouseOut() {
		if (!get(solving)) return;
		highlightedRows.set([]);
	}
</script>

<h2>Deduction Rules</h2>
<RuleGridLayout>
	{#each $deductionRules as rule (rule.short)}
		<RuleSlot
			{rule}
			onClick={() => onRuleClick(rule)}
			onMouseOver={() => onRuleMouseOver(rule)}
			onMouseOut={onRuleMouseOut}
		/>
	{/each}
</RuleGridLayout>
