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

	type ConnectivePosition = 'before' | 'after';

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

	const pickVariableToReplaceModal = (
		variables: string[] = []
	): Promise<{ placeholder: string; idx: number }> => {
		return new Promise((resolve) => {
			const variableButtons = variables.map((variable, idx) => ({
				text: variable,
				action: () => {
					resolve({ placeholder: variable, idx });
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
		const variables = rowTree?.variables.filter((v) =>
			[NodeType.CONSTANT, NodeType.VARIABLE].includes(v.type)
		);

		console.log(variables);

		let quantifierVar = isElimination
			? { varName: rowTree?.children[1]?.value, type: NodeType.VARIABLE }
			: [...(variables ?? [])][0];

		let placeholder = quantifierVar.varName;

		if (!placeholder) {
			return showToast('No variables found in the formula', 'error');
		}

		if (!isElimination && variables && variables.length > 1) {
			let result = await pickVariableToReplaceModal([...variables].map((v) => v.varName ?? ''));
			placeholder = result.placeholder;
			quantifierVar = [...variables][result.idx];
		}

		const suggestions = await getSuggestionsForTerm(suggestedTerm);

		await modals.open(ReplaceQuantifierVariableModal, {
			title: isElimination ? 'Replace Variable in Quantifier' : 'Introduce Variable for Quantifier',
			row: proof[selected[0] - 1],
			placeholder,
			onConfirm: (modalInput: HTMLInputElement) => {
				const formula = validateFormulaInput(modalInput);
				if (!formula) return;

				// TODO: Can i replace it with a free variable?
				if (isElimination && rule.short === 'EEX' && formula.tree!.type !== NodeType.CONSTANT) {
					return showToast('The variable needs to be replaced with a constant', 'error');
				}

				if (!isElimination && formula.tree!.type !== NodeType.VARIABLE) {
					return showToast('The term needs to be a variable', 'error');
				}

				console.log(quantifierVar);
				console.log(placeholder);
				console.log(formula.tree);

				const quantifierVarFormat =
					quantifierVar.type === NodeType.VARIABLE
						? `var(${placeholder})`
						: `const(${placeholder})`;
				const extraArgs = isElimination
					? [rowTree!.children[1]!.toPrologFormat(), formula.tree!.toPrologFormat()]
					: [quantifierVarFormat, formula.tree!.toPrologFormat()];

				provePrologLines(selected, rule, extraArgs).then(() => {
					selectedRows.set([]);
				});

				console.log(extraArgs);
			},
			suggestions
		});
	};

	const openFormulaInputModal = (
		title: string,
		content: string,
		onConfirm: (formula: string, connectivePosition: ConnectivePosition) => void
	) => {
		modals.open(InputModal, {
			title,
			content,
			placeholder: 'Enter the formula',
			showConnectivePosition: true,
			defaultConnectivePosition: 'after',
			onConfirm: (
				modalInput: HTMLInputElement,
				connectivePosition: ConnectivePosition = 'after'
			) => {
				const formula = validateFormulaInput(modalInput);
				if (!formula) return;
				onConfirm(formula.tree!.toPrologFormat(), connectivePosition);
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

		if ([NDRule.IDIS, NDRule.IIMP].includes(rule.short)) {
			return openFormulaInputModal(
				'Insert Formula',
				'Write the formula to insert (without the main connective)',
				(formula, connectivePosition) => {
					if (connectivePosition === 'before') {
						premises.unshift(formula);
					} else {
						premises.push(formula);
					}
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

<div class="wrapper">
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
</div>

<style>
	h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.wrapper {
		width: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;
		gap: var(--spacing-md);
	}
</style>
