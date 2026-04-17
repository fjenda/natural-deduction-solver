<script lang="ts">
	import {
		appliedRuleToDisplayString,
		cloneAppliedRule,
		type AppliedRule,
		type AppliedRuleReplacement,
		type RuleReplacementKind
	} from '../../../../../types/AppliedRule';
	import { solverContent } from '../../../../../stores/solverStore';
	import { DeductionRule, NDRule } from '../../../../rules/DeductionRule';
	import { PrettySyntaxer } from '../../../parsers/PrettySyntaxer';
	import { NodeType } from '../../../../syntax-checker/NodeType';
	import { getMissingProofLines } from '../../../utils/appliedRuleUtils';

	interface RuleEditorProps {
		ruleDraft: AppliedRule;
		editable: boolean;
		onEnter?: () => void;
		onValidationChange?: (valid: boolean) => void;
	}

	let { ruleDraft = $bindable(), editable, onEnter, onValidationChange }: RuleEditorProps = $props();

	let syncToken = $state('');
	let ruleName = $state('');
	let lineRefs = $state('');
	let eliminationTerm = $state('');
	let eliminationTermKind = $state<RuleReplacementKind>('constant');
	let introductionVariable = $state('');
	let introductionSourceKey = $state('');
	let isValid = $state(true);
	let ruleDetailsOpen = $state(false);

	const parseLineRefs = (value: string): number[] => {
		if (!value.trim()) return [];

		return value
			.split(',')
			.map((segment) => Number(segment.trim()))
			.filter((line) => Number.isInteger(line) && line > 0);
	};

	const ruleSuggestions = $derived(['PREM', 'CONC', ...DeductionRule.rules.map((r) => r.short)]);
	const normalizedRuleName = $derived(ruleName.trim().toUpperCase());
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
						? `Constant ${entry.varName}`
						: `Variable ${entry.varName}`
			}));
	});
	const rowWarning = $derived.by(() => {
		if (lineRefsFormatInvalid) return 'Use row numbers separated by commas, e.g. 1,2.';
		if (missingLines.length > 0) return `Row ${missingLines[0]} doesn't exist.`;
		return '';
	});
	const citedQuantifierReplacement = $derived.by(() => {
		const variableNode = citedRow?.tree?.type === NodeType.QUANTIFIER ? citedRow.tree.children[1] : null;
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

	const buildRuleDraft = (): AppliedRule => {
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
			const selectedSource = introductionSources.find((entry) => entry.key === introductionSourceKey);
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
	};
	const rulePreview = $derived(appliedRuleToDisplayString(buildRuleDraft()));

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

	const onRuleNameInput = () => {
		ruleName = PrettySyntaxer.cleanupRule(ruleName).toUpperCase();
		if (!requiresQuantifierDetails) {
			ruleDetailsOpen = false;
		} else {
			ruleDetailsOpen = true;
		}
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

	/**
	 * Validates the rule editor state in real-time.
	 */
	const validateRule = () => {
		const trimmed = normalizedRuleName;
		if (!trimmed) {
			isValid = true;
			onValidationChange?.(true);
			return;
		}

		const knownRule =
			trimmed === 'PREM' ||
			trimmed === 'CONC' ||
			DeductionRule.rules.some((r) => r.short === trimmed);

		if (!knownRule || lineRefsFormatInvalid || missingLines.length > 0) {
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

	/**
	 * Handles keydown events in the rule input.
	 * Triggers save on Enter key.
	 * @param event - the keyboard event
	 */
	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' && onEnter) {
			event.preventDefault();
			onEnter();
		}
	};

	$effect(() => {
		const currentToken = JSON.stringify(ruleDraft);
		if (currentToken !== syncToken) {
			syncFromDraft();
		}
	});

	$effect(() => {
		if (isQuantifierIntroduction && !introductionSources.some((entry) => entry.key === introductionSourceKey)) {
			introductionSourceKey = introductionSources.length === 1 ? introductionSources[0].key : '';
		}

		if (isQuantifierIntroduction && introductionSources.length === 1) {
			ruleDetailsOpen = true;
			commitRuleDraft();
		}
	});

	$effect(() => {
		citedLines.join(',');
		missingLines.join(',');
		citedQuantifierReplacement?.value;
		citedQuantifierReplacement?.kind;
		introductionSources.map((entry) => entry.key).join('|');
		commitRuleDraft();
	});

	$effect(() => {
		if (!requiresQuantifierDetails) {
			ruleDetailsOpen = false;
		}
	});
</script>

{#if editable}
	<div class="editor-shell" class:invalid={!isValid}>
		<div class="editor-bar">
			<label class="field">
				<span>Rule</span>
				<input
					id="rule-input"
					class="row-input compact"
					type="text"
					list="rule-suggestions"
					bind:value={ruleName}
					oninput={onRuleNameInput}
					onkeydown={handleKeydown}
					placeholder="e.g. EC"
				/>
			</label>

			<label class="field">
				<span>Rows</span>
				<input
					class="row-input compact"
					class:warning={rowWarning !== ''}
					type="text"
					bind:value={lineRefs}
					oninput={commitRuleDraft}
					onkeydown={handleKeydown}
					placeholder="e.g. 1,2"
				/>
				{#if rowWarning}
					<span class="field-warning">{rowWarning}</span>
				{/if}
			</label>

			<div class="preview-chip" class:muted={!rulePreview}>
				{rulePreview || 'Rule preview'}
			</div>

			{#if requiresQuantifierDetails}
				<button
					type="button"
					class="details-toggle"
					onclick={toggleRuleDetails}
					aria-expanded={ruleDetailsOpen}
				>
					<i class={`fas ${ruleDetailsOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
					Substitution
				</button>
			{/if}
		</div>

		{#if ruleDetailsOpen && isQuantifierElimination}
			<div class="details-card">
				<div class="details-copy">
					<div class="detail-title">Quantifier substitution</div>
					<div class="detail-text">
						From row
						<strong>{citedLines[0] || '—'}</strong>
						{#if citedQuantifierReplacement}
							replace
							<strong>
								{citedQuantifierReplacement.value}
							</strong>
						{:else}
							choose a quantified row first
						{/if}
					</div>
				</div>

				<label class="field grow">
					<span>{normalizedRuleName === NDRule.EEX ? 'Fresh constant' : 'Replacement term'}</span>
					<div class="term-editor">
						<input
							class="row-input"
							type="text"
							bind:value={eliminationTerm}
							oninput={commitRuleDraft}
							onkeydown={handleKeydown}
							placeholder={normalizedRuleName === NDRule.EEX ? 'e.g. a' : 'e.g. a or f(a)'}
						/>

						{#if normalizedRuleName === NDRule.EALL}
							<div class="chip-group" role="group" aria-label="Replacement kind">
								{#each [
									{ key: 'constant', label: 'constant' },
									{ key: 'variable', label: 'variable' },
									{ key: 'term', label: 'complex term' }
								] as option (option.key)}
									<button
										type="button"
										class="chip"
										class:active={eliminationTermKind === option.key}
										onclick={() => chooseEliminationKind(option.key as RuleReplacementKind)}
									>
										{option.label}
									</button>
								{/each}
							</div>
						{/if}
					</div>
				</label>
			</div>
		{:else if ruleDetailsOpen && isQuantifierIntroduction}
			<div class="details-card">
				<div class="details-copy">
					<div class="detail-title">Quantifier substitution</div>
					<div class="detail-text">
						Choose the term from row <strong>{citedLines[0] || '—'}</strong> and the variable you want to introduce.
					</div>
				</div>

				<div class="details-grid">
					<div class="field grow">
						<span>Replace in formula</span>
						{#if introductionSources.length > 0}
							<div class="chip-group" role="group" aria-label="Replace in formula">
								{#each introductionSources as source (source.key)}
									<button
										type="button"
										class="chip"
										class:active={introductionSourceKey === source.key}
										onclick={() => chooseIntroductionSource(source.key)}
									>
										{source.value}
									</button>
								{/each}
							</div>
						{:else}
							<div class="empty-state">No constants or variables found in the cited row.</div>
						{/if}
					</div>

					<label class="field grow">
						<span>Introduced variable</span>
						<input
							class="row-input"
							type="text"
							bind:value={introductionVariable}
							oninput={commitRuleDraft}
							onkeydown={handleKeydown}
							placeholder="e.g. x"
						/>
					</label>
				</div>
			</div>
		{/if}
	</div>

	<datalist id="rule-suggestions">
		{#each ruleSuggestions as suggestion (suggestion)}
			<option value={suggestion}></option>
		{/each}
	</datalist>
{:else}
	{appliedRuleToDisplayString(ruleDraft)}
{/if}

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.editor-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: var(--spacing-sm);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--spacing-sm);
	}

	.term-editor {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: var(--spacing-sm);
		align-items: center;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.78rem;
		color: var(--text-secondary);
		min-width: 8rem;
	}

	.field.grow {
		flex: 1;
		min-width: 12rem;
	}

	.field span {
		font-weight: 600;
	}

	.row-input {
		width: 100%;
		font-size: 1em;
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		height: auto;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.row-input.compact {
		min-width: 7rem;
	}

	.row-input.warning {
		border-color: var(--warning);
	}

	.field-warning {
		font-size: 0.72rem;
		color: var(--warning);
	}

	.preview-chip {
		display: flex;
		align-items: center;
		min-height: 2.4rem;
		padding: 0 var(--spacing-md);
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		color: var(--text-primary);
		font-size: 0.85rem;
		white-space: nowrap;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-chip.muted {
		color: var(--text-secondary);
	}

	.details-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		height: 2.4rem;
		padding: 0 var(--spacing-md);
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		color: var(--text-primary);
		font-size: 0.85rem;
		box-shadow: none;
	}

	.details-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
	}

	.chip {
		padding: 0.45rem 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		font-size: 0.8rem;
		line-height: 1;
		box-shadow: none;
	}

	.chip.active {
		border-color: var(--accent);
		background: rgba(37, 99, 235, 0.1);
		color: var(--accent);
	}

	.empty-state {
		padding: var(--spacing-sm) var(--spacing-md);
		border: 1px dashed var(--border);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 0.8rem;
	}

	.details-copy {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.detail-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.detail-text {
		font-size: 0.82rem;
		color: var(--text-secondary);
		line-height: 1.45;
	}

	.readonly-value,
	.detail-text strong {
		display: flex;
		font-family: monospace;
	}

	.row-input:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.editor-shell.invalid .row-input,
	.editor-shell.invalid .details-toggle,
	.editor-shell.invalid .preview-chip {
		border-color: var(--error);
	}

	@media screen and (max-width: 950px) {
		.details-grid {
			grid-template-columns: 1fr;
		}

		.term-editor {
			grid-template-columns: 1fr;
		}

		.preview-chip {
			width: 100%;
		}
	}
</style>
