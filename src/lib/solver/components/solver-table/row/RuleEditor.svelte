<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		appliedRuleToDisplayString,
		cloneAppliedRule,
		type AppliedRule,
		type AppliedRuleReplacement,
		type RuleReplacementKind
	} from '../../../../../types/AppliedRule';
	import { solverContent } from '../../../../../stores/solverStore';
	import { DeductionRule, NDRule } from '../../../../rules/DeductionRule';
	import { NodeType } from '../../../../syntax-checker/NodeType';
	import { getMissingProofLines } from '../../../utils/appliedRuleUtils';
	import {
		getRuleActionText,
		getRulePickerOptions,
		getRulePresentation
	} from '../../../utils/rulePresentation';
	import QuantifierEliminationCard from './rule-editor/QuantifierEliminationCard.svelte';
	import QuantifierIntroductionCard from './rule-editor/QuantifierIntroductionCard.svelte';
	import RuleEditorToolbar from './rule-editor/RuleEditorToolbar.svelte';

	interface RuleEditorProps {
		ruleDraft: AppliedRule;
		editable: boolean;
		onEnter?: () => void;
		onValidationChange?: (valid: boolean) => void;
	}

	let {
		ruleDraft = $bindable(),
		editable,
		onEnter,
		onValidationChange
	}: RuleEditorProps = $props();

	let editorRoot = $state<HTMLDivElement | undefined>(undefined);
	let pickerTrigger = $state<HTMLButtonElement | undefined>(undefined);
	let pickerSearchInput = $state<HTMLInputElement | undefined>(undefined);
	let pickerPanelStyle = $state('');

	let syncToken = $state('');
	let ruleName = $state('');
	let lineRefs = $state('');
	let eliminationTerm = $state('');
	let eliminationTermKind = $state<RuleReplacementKind>('constant');
	let introductionVariable = $state('');
	let introductionSourceKey = $state('');
	let isValid = $state(true);
	let ruleDetailsOpen = $state(false);
	let rulePickerOpen = $state(false);
	let ruleQuery = $state('');

	const eliminationKindOptions: Array<{ key: RuleReplacementKind; label: string }> = [
		{ key: 'constant', label: 'constant' },
		{ key: 'variable', label: 'variable' },
		{ key: 'term', label: 'complex term' }
	];

	const parseLineRefs = (value: string): number[] => {
		if (!value.trim()) return [];

		return value
			.split(',')
			.map((segment) => Number(segment.trim()))
			.filter((line) => Number.isInteger(line) && line > 0);
	};

	const normalizedRuleName = $derived(ruleName.trim().toUpperCase());
	const ruleOptions = $derived.by(() => getRulePickerOptions());
	const selectedRulePresentation = $derived.by(() =>
		normalizedRuleName ? getRulePresentation(normalizedRuleName) : null
	);
	const filteredRuleOptions = $derived.by(() => {
		const query = ruleQuery.trim().toLowerCase();
		if (!query) return ruleOptions;

		return ruleOptions.filter((option) => option.searchText.includes(query));
	});
	const citedLines = $derived(parseLineRefs(lineRefs));
	const lineRefsFormatInvalid = $derived(
		lineRefs.trim() !== '' && !/^\d+(\s*,\s*\d+)*$/.test(lineRefs.trim())
	);
	const missingLines = $derived(getMissingProofLines(citedLines, $solverContent.proof.length));
	const citedRow = $derived($solverContent.proof[citedLines[0] - 1] ?? null);
	const introductionSources = $derived.by(() => {
		if (!citedRow?.tree) return [];

		return citedRow.tree.variables
			.filter((entry) => [NodeType.VARIABLE, NodeType.CONSTANT].includes(entry.type))
			.map((entry) => ({
				key: `${entry.type}:${entry.varName}`,
				value: entry.varName,
				kind: (entry.type === NodeType.CONSTANT ? 'constant' : 'variable') as RuleReplacementKind,
				label:
					entry.type === NodeType.CONSTANT
						? `constant ${entry.varName}`
						: `variable ${entry.varName}`
			}));
	});
	const rowWarning = $derived.by(() => {
		if (lineRefsFormatInvalid) return 'Use row numbers separated by commas, e.g. 1,2.';
		if (missingLines.length > 0) return `Row ${missingLines[0]} doesn't exist.`;
		return '';
	});
	const citedQuantifierReplacement = $derived.by(() => {
		const variableNode =
			citedRow?.tree?.type === NodeType.QUANTIFIER ? citedRow.tree.children[1] : null;
		if (!variableNode?.value) return null;

		return {
			value: variableNode.value,
			kind: variableNode.type === NodeType.CONSTANT ? 'constant' : 'variable'
		} as AppliedRuleReplacement;
	});
	const isQuantifierElimination = $derived(
		[NDRule.EALL, NDRule.EEX].includes(normalizedRuleName as NDRule)
	);
	const isQuantifierIntroduction = $derived(
		[NDRule.IALL, NDRule.IEX].includes(normalizedRuleName as NDRule)
	);
	const requiresQuantifierDetails = $derived(isQuantifierElimination || isQuantifierIntroduction);
	const detailsLabel = $derived(selectedRulePresentation?.title ?? 'Quantifier substitution');
	const detailActionText = $derived(getRuleActionText(normalizedRuleName));
	const rulePreview = $derived(appliedRuleToDisplayString(buildRuleDraft()));

	function buildRuleDraft(): AppliedRule {
		const replacements: AppliedRuleReplacement[] = [];

		if (isQuantifierElimination) {
			if (citedQuantifierReplacement) replacements.push({ ...citedQuantifierReplacement });
			if (eliminationTerm.trim()) {
				replacements.push({
					value: eliminationTerm.trim(),
					kind: normalizedRuleName === NDRule.EEX ? 'constant' : eliminationTermKind
				});
			}
		} else if (isQuantifierIntroduction) {
			const selectedSource = introductionSources.find(
				(entry) => entry.key === introductionSourceKey
			);
			if (selectedSource) {
				replacements.push({ value: selectedSource.value, kind: selectedSource.kind });
			}

			if (introductionVariable.trim()) {
				replacements.push({ value: introductionVariable.trim(), kind: 'variable' });
			}
		}

		return {
			rule: normalizedRuleName,
			lines: citedLines,
			replacements
		};
	}

	const syncFromDraft = () => {
		const draft = cloneAppliedRule(ruleDraft);
		ruleName = draft.rule === NDRule.UNKNOWN ? '' : draft.rule;
		lineRefs = draft.lines?.join(',') ?? '';
		eliminationTerm = draft.replacements?.[1]?.value ?? '';
		eliminationTermKind = draft.replacements?.[1]?.kind ?? 'constant';
		introductionVariable = draft.replacements?.[1]?.value ?? '';
		introductionSourceKey = '';

		if (draft.replacements?.[0]) {
			const first = draft.replacements[0];
			const sourceKey = `${first.kind === 'constant' ? NodeType.CONSTANT : NodeType.VARIABLE}:${first.value}`;
			if (introductionSources.some((entry) => entry.key === sourceKey)) {
				introductionSourceKey = sourceKey;
			}
		}

		syncToken = JSON.stringify(draft);
	};

	const validateRule = () => {
		if (!normalizedRuleName) {
			isValid = true;
			onValidationChange?.(true);
			return;
		}

		const knownRule =
			normalizedRuleName === 'PREM' ||
			normalizedRuleName === 'CONC' ||
			DeductionRule.rules.some((r) => r.short === normalizedRuleName);

		if (!knownRule) {
			isValid = false;
			onValidationChange?.(false);
			return;
		}

		if (lineRefsFormatInvalid || missingLines.length > 0) {
			isValid = false;
			onValidationChange?.(false);
			return;
		}

		if (isQuantifierElimination) {
			isValid = !!citedQuantifierReplacement && eliminationTerm.trim().length > 0;
			onValidationChange?.(isValid);
			return;
		}

		if (isQuantifierIntroduction) {
			isValid = introductionSourceKey !== '' && introductionVariable.trim().length > 0;
			onValidationChange?.(isValid);
			return;
		}

		isValid = true;
		onValidationChange?.(true);
	};

	const commitRuleDraft = () => {
		const next = buildRuleDraft();
		const nextToken = JSON.stringify(next);
		if (nextToken === syncToken) {
			validateRule();
			return;
		}

		ruleDraft = next;
		syncToken = nextToken;
		validateRule();
	};

	const closeRulePicker = () => {
		rulePickerOpen = false;
		ruleQuery = '';
		pickerPanelStyle = '';
	};

	const updatePickerPosition = () => {
		if (!rulePickerOpen || !pickerTrigger) return;

		const rect = pickerTrigger.getBoundingClientRect();
		const viewportPadding = 12;
		const preferredWidth = Math.max(rect.width, 340);
		const width = Math.min(preferredWidth, window.innerWidth - viewportPadding * 2);
		const left = Math.min(
			Math.max(viewportPadding, rect.left),
			window.innerWidth - width - viewportPadding
		);
		const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
		const maxHeight = Math.max(180, Math.min(320, spaceBelow - 8));
		const top = Math.min(rect.bottom + 8, window.innerHeight - maxHeight - viewportPadding);

		pickerPanelStyle = `position: fixed; left: ${left}px; top: ${top}px; width: ${width}px; max-height: ${maxHeight}px;`;
	};

	const openRulePicker = async () => {
		rulePickerOpen = true;
		ruleQuery = '';
		await tick();
		updatePickerPosition();
		pickerSearchInput?.focus();
	};

	const toggleRulePicker = async () => {
		if (rulePickerOpen) {
			closeRulePicker();
			return;
		}

		await openRulePicker();
	};

	const selectRule = (code: string) => {
		ruleName = code;
		ruleDetailsOpen = [NDRule.EALL, NDRule.EEX, NDRule.IALL, NDRule.IEX].includes(code as NDRule);

		closeRulePicker();
		commitRuleDraft();
	};

	const toggleRuleDetails = () => {
		if (!requiresQuantifierDetails) return;
		ruleDetailsOpen = !ruleDetailsOpen;
	};

	const chooseEliminationKind = (kind: RuleReplacementKind) => {
		eliminationTermKind = kind;
		commitRuleDraft();
	};

	const chooseIntroductionSource = (key: string) => {
		introductionSourceKey = key;
		commitRuleDraft();
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			closeRulePicker();
			return;
		}

		if (event.key === 'Enter' && onEnter && !rulePickerOpen) {
			event.preventDefault();
			onEnter();
		}
	};

	const handlePickerSearchKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			closeRulePicker();
			return;
		}

		if (filteredRuleOptions.length > 0 && event.key === 'Enter') {
			event.preventDefault();
			selectRule(filteredRuleOptions[0].code);
		}
	};

	const handleDocumentPointerDown = (event: PointerEvent) => {
		if (rulePickerOpen && editorRoot && !editorRoot.contains(event.target as Node)) {
			closeRulePicker();
		}
	};

	const handleViewportChange = () => {
		updatePickerPosition();
	};

	onMount(() => {
		document.addEventListener('pointerdown', handleDocumentPointerDown);
		window.addEventListener('scroll', handleViewportChange, true);
		window.addEventListener('resize', handleViewportChange);
	});

	onDestroy(() => {
		document.removeEventListener('pointerdown', handleDocumentPointerDown);
		window.removeEventListener('scroll', handleViewportChange, true);
		window.removeEventListener('resize', handleViewportChange);
	});

	$effect(() => {
		const currentToken = JSON.stringify(ruleDraft);
		if (currentToken !== syncToken) {
			syncFromDraft();
		}
	});

	$effect(() => {
		void isQuantifierIntroduction;
		void introductionSourceKey;
		void introductionSources.length;
		const introMode = Boolean(isQuantifierIntroduction);
		const selectedSourceStillExists = introductionSources.some(
			(entry) => entry.key === introductionSourceKey
		);

		if (introMode && !selectedSourceStillExists) {
			introductionSourceKey = introductionSources.length === 1 ? introductionSources[0].key : '';
		}

		if (introMode && introductionSources.length === 1) {
			ruleDetailsOpen = true;
			commitRuleDraft();
		}
	});

	$effect(() => {
		citedLines.join(',');
		missingLines.join(',');
		void citedQuantifierReplacement?.value;
		void citedQuantifierReplacement?.kind;
		introductionSources.map((entry) => entry.key).join('|');
		commitRuleDraft();
	});

	$effect(() => {
		if (!requiresQuantifierDetails) {
			ruleDetailsOpen = false;
		}
	});

	$effect(() => {
		void selectedRulePresentation?.code;
		validateRule();
	});

	$effect(() => {
		if (rulePickerOpen) {
			updatePickerPosition();
		}
	});
</script>

{#if editable}
	<div class="editor-shell" bind:this={editorRoot}>
		<RuleEditorToolbar
			bind:lineRefs
			bind:pickerTrigger
			bind:pickerSearchInput
			bind:ruleQuery
			{selectedRulePresentation}
			{rulePickerOpen}
			{filteredRuleOptions}
			{pickerPanelStyle}
			{rowWarning}
			{rulePreview}
			{requiresQuantifierDetails}
			{ruleDetailsOpen}
			isInvalid={!isValid}
			onToggleRulePicker={toggleRulePicker}
			onKeydown={handleKeydown}
			onSearchKeydown={handlePickerSearchKeydown}
			onSelectRule={selectRule}
			onLineInput={commitRuleDraft}
			onToggleRuleDetails={toggleRuleDetails}
		/>

		{#if ruleDetailsOpen && isQuantifierElimination}
			<QuantifierEliminationCard
				bind:eliminationTerm
				{selectedRulePresentation}
				{detailsLabel}
				{detailActionText}
				citedLine={citedLines[0]}
				{citedQuantifierReplacement}
				{normalizedRuleName}
				{eliminationTermKind}
				{eliminationKindOptions}
				isInvalid={!isValid}
				onTermInput={commitRuleDraft}
				onKeydown={handleKeydown}
				onKindSelect={chooseEliminationKind}
			/>
		{:else if ruleDetailsOpen && isQuantifierIntroduction}
			<QuantifierIntroductionCard
				bind:introductionVariable
				{selectedRulePresentation}
				{detailsLabel}
				{detailActionText}
				citedLine={citedLines[0]}
				{introductionSources}
				{introductionSourceKey}
				isInvalid={!isValid}
				onSourceSelect={chooseIntroductionSource}
				onVariableInput={commitRuleDraft}
				onKeydown={handleKeydown}
			/>
		{/if}
	</div>
{:else}
	{appliedRuleToDisplayString(ruleDraft)}
{/if}

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		width: 100%;
	}
</style>

