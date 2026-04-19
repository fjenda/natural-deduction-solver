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
	const selectedIntroductionSource = $derived.by(
		() => introductionSources.find((entry) => entry.key === introductionSourceKey) ?? null
	);
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

		if (event.key === 'Enter' && filteredRuleOptions.length > 0) {
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
	<div class="editor-shell" class:invalid={!isValid} bind:this={editorRoot}>
		<div class="editor-bar">
			<div class="editor-grid">
				<div class="field picker-field">
					<span>Rule</span>
					<button
						id="rule-input"
						type="button"
						class="picker-trigger"
						bind:this={pickerTrigger}
						onclick={toggleRulePicker}
						onkeydown={handleKeydown}
						aria-expanded={rulePickerOpen}
						aria-haspopup="listbox"
					>
						<span class="picker-copy-wrap">
							<span class="picker-symbol" class:placeholder={!selectedRulePresentation}>
								{selectedRulePresentation?.symbol ?? '∗'}
							</span>
							<span class="picker-copy">
								<span class="picker-code">{selectedRulePresentation?.code ?? 'Choose rule'}</span>
								<span class="picker-title">
									{selectedRulePresentation?.title ?? 'Search by code, symbol, or rule name'}
								</span>
							</span>
						</span>
						<i class={`fas ${rulePickerOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
					</button>

					{#if rulePickerOpen}
						<div class="picker-panel" style={pickerPanelStyle}>
							<input
								bind:this={pickerSearchInput}
								class="row-input picker-search"
								type="text"
								bind:value={ruleQuery}
								onkeydown={handlePickerSearchKeydown}
								placeholder="Search rule picker"
							/>

							<div class="picker-options" role="listbox" aria-label="Rule picker options">
								{#each filteredRuleOptions as option (option.code)}
									<button
										type="button"
										class="picker-option"
										class:active={normalizedRuleName === option.code}
										onclick={() => selectRule(option.code)}
									>
										<span class="picker-option-symbol">{option.symbol}</span>
										<span class="picker-option-copy">
											<span class="picker-option-code">{option.code}</span>
											<span class="picker-option-title">{option.title}</span>
										</span>
									</button>
								{/each}

								{#if filteredRuleOptions.length === 0}
									<div class="empty-picker-state">No matching rule found.</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<label class="field compact-field rows-field">
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

				<div class="field compact-field preview-field">
					<span>Status</span>
					<div
						class="preview-chip"
						class:muted={!rulePreview}
						title={rulePreview || 'Rule preview'}
					>
						<span class="preview-indicator" class:ready={!!rulePreview}></span>
						<span class="preview-value">{rulePreview || 'Preview updates here'}</span>
					</div>
				</div>

				{#if requiresQuantifierDetails}
					<div class="field compact-field toggle-field">
						<span>Substitution</span>
						<button
							type="button"
							class="details-toggle"
							onclick={toggleRuleDetails}
							aria-expanded={ruleDetailsOpen}
						>
							<i class={`fas ${ruleDetailsOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
							<span>{ruleDetailsOpen ? 'Hide card' : 'Open card'}</span>
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if ruleDetailsOpen && isQuantifierElimination}
			<div class="details-card">
				<div class="details-header">
					<div class="detail-title-row">
						<span class="detail-badge">{selectedRulePresentation?.symbol ?? '∀/∃'}</span>
						<div class="detail-copy">
							<div class="detail-title">{detailsLabel}</div>
							<div class="detail-subtitle">{detailActionText}</div>
						</div>
					</div>
				</div>

				<div class="guidance-strip">
					<span class="sentence-label">Using</span>
					<span class="sentence-chip">row {citedLines[0] || '—'}</span>
					<span class="sentence-label">instantiate</span>
					<span class="sentence-chip" class:empty={!citedQuantifierReplacement}>
						{citedQuantifierReplacement?.value ?? 'quantified variable'}
					</span>
					<span class="sentence-label">as</span>
					<div class="inline-input-wrap">
						<input
							class="row-input inline-input"
							type="text"
							bind:value={eliminationTerm}
							oninput={commitRuleDraft}
							onkeydown={handleKeydown}
							placeholder={normalizedRuleName === NDRule.EEX ? 'e.g. a' : 'e.g. a or f(a)'}
						/>
					</div>
				</div>

				{#if normalizedRuleName === NDRule.EEX}
					<div class="helper-banner">
						<i class="fas fa-sparkles"></i>
						<span
							>Name the witness with a fresh constant that does not already appear in the proof.</span
						>
					</div>
				{:else}
					<div class="option-group">
						<span class="option-group-label">Term type</span>
						<div class="chip-group" role="group" aria-label="Replacement kind">
							{#each eliminationKindOptions as option (option.key)}
								<button
									type="button"
									class="chip"
									class:active={eliminationTermKind === option.key}
									onclick={() => chooseEliminationKind(option.key)}
								>
									{option.label}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		{:else if ruleDetailsOpen && isQuantifierIntroduction}
			<div class="details-card">
				<div class="details-header">
					<div class="detail-title-row">
						<span class="detail-badge">{selectedRulePresentation?.symbol ?? '∀/∃'}</span>
						<div class="detail-copy">
							<div class="detail-title">{detailsLabel}</div>
							<div class="detail-subtitle">{detailActionText}</div>
						</div>
					</div>
				</div>

				<div class="guidance-strip intro-strip">
					<span class="sentence-label">Using</span>
					<span class="sentence-chip">row {citedLines[0] || '—'}</span>
					<span class="sentence-label">replace</span>
					<div class="selection-block">
						{#if introductionSources.length > 0}
							<div class="chip-group" role="group" aria-label="Choose source symbol">
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
					<span class="sentence-label">with variable</span>
					<div class="inline-input-wrap intro-input-wrap">
						<input
							class="row-input inline-input"
							type="text"
							bind:value={introductionVariable}
							oninput={commitRuleDraft}
							onkeydown={handleKeydown}
							placeholder="e.g. x"
						/>
					</div>
				</div>

				<div
					class="selection-summary"
					class:muted={!selectedIntroductionSource && !introductionVariable.trim()}
				>
					{#if selectedIntroductionSource && introductionVariable.trim()}
						Generalizing {selectedIntroductionSource.label} into variable {introductionVariable.trim()}.
					{:else}
						Choose a cited symbol and the variable name you want the quantifier to bind.
					{/if}
				</div>
			</div>
		{/if}
	</div>
{:else}
	{appliedRuleToDisplayString(ruleDraft)}
{/if}

<style>
	.editor-shell {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.editor-bar {
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0));
	}

	.editor-grid {
		display: grid;
		grid-template-columns: minmax(16rem, 1.45fr) minmax(8.5rem, 0.7fr) minmax(11rem, 0.75fr) minmax(
				9.5rem,
				0.8fr
			);
		gap: var(--spacing-sm);
		align-items: end;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.78rem;
		color: var(--text-secondary);
		min-width: 0;
	}

	.field > span:first-child {
		font-weight: 600;
	}

	.picker-field {
		position: relative;
	}

	.rows-field,
	.preview-field,
	.toggle-field {
		min-width: 0;
	}

	.row-input {
		width: 100%;
		font-size: 1em;
		min-height: 2.95rem;
		padding: 0.72rem 0.85rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.row-input.warning {
		border-color: var(--warning);
	}

	.field-warning {
		font-size: 0.72rem;
		color: var(--warning);
	}

	.field-warning.info {
		color: var(--text-secondary);
	}

	.row-input:disabled {
		cursor: not-allowed;
		opacity: 0.75;
		background: rgba(255, 255, 255, 0.025);
	}

	.picker-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		width: 100%;
		min-height: 2.95rem;
		padding: 0.6rem 0.8rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		text-align: left;
	}

	.picker-copy-wrap {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		min-width: 0;
	}

	.picker-symbol,
	.picker-option-symbol,
	.detail-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.1rem;
		height: 2.1rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: rgba(37, 99, 235, 0.1);
		color: var(--accent);
		font-weight: 700;
		font-size: 0.82rem;
		flex-shrink: 0;
	}

	.picker-symbol.placeholder {
		background: rgba(148, 163, 184, 0.12);
		color: var(--text-secondary);
	}

	.picker-copy,
	.picker-option-copy,
	.detail-copy {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.picker-code,
	.picker-option-code {
		font-weight: 700;
		font-size: 0.82rem;
		color: var(--text-primary);
	}

	.picker-title,
	.picker-option-title {
		font-size: 0.74rem;
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.picker-panel {
		position: fixed;
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-lg);
		z-index: 200;
		overflow: hidden;
	}

	.picker-search {
		padding-block: 0.68rem;
	}

	.picker-options {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		gap: 0.35rem;
		overflow: auto;
	}

	.picker-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.6rem 0.7rem;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
	}

	.picker-option:hover,
	.picker-option.active {
		border-color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
	}

	.empty-picker-state,
	.empty-state,
	.selection-summary {
		padding: 0.8rem 0.9rem;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
	}

	.empty-picker-state,
	.empty-state {
		border: 1px dashed var(--border);
		color: var(--text-secondary);
	}

	.preview-chip,
	.details-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 2.95rem;
		padding: 0.55rem 0.85rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		color: var(--text-primary);
	}

	.preview-chip {
		overflow: hidden;
		justify-content: flex-start;
	}

	.preview-indicator {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--text-secondary);
		opacity: 0.5;
		flex-shrink: 0;
	}

	.preview-indicator.ready {
		background: #22c55e;
		opacity: 1;
	}

	.preview-value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-chip.muted {
		color: var(--text-secondary);
	}

	.details-toggle {
		justify-content: center;
		border-radius: 999px;
		font-size: 0.84rem;
		white-space: nowrap;
	}

	.details-card {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md);
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0));
	}

	.detail-title-row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.detail-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.detail-subtitle {
		font-size: 0.8rem;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.guidance-strip {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 0.95rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.02);
	}

	.intro-strip {
		align-items: stretch;
	}

	.sentence-label {
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.sentence-chip {
		display: inline-flex;
		align-items: center;
		min-height: 2.3rem;
		padding: 0.45rem 0.8rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		max-width: 100%;
		overflow-wrap: anywhere;
	}

	.sentence-chip.empty {
		color: var(--text-secondary);
		border-style: dashed;
	}

	.inline-input-wrap {
		flex: 1 1 12rem;
		min-width: min(12rem, 100%);
	}

	.intro-input-wrap {
		flex: 0 1 9rem;
		max-width: 10rem;
	}

	.inline-input {
		min-height: 2.55rem;
	}

	.selection-block,
	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		min-width: min(14rem, 100%);
	}

	.option-group-label {
		font-size: 0.76rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
	}

	.helper-banner {
		display: inline-flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0.75rem 0.9rem;
		border-radius: var(--radius-md);
		border: 1px solid rgba(34, 197, 94, 0.2);
		background: rgba(34, 197, 94, 0.08);
		font-size: 0.84rem;
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		min-width: 0;
	}

	.chip {
		padding: 0.5rem 0.78rem;
		border-radius: 999px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		font-size: 0.8rem;
		font-weight: 600;
		max-width: 100%;
		white-space: normal;
	}

	.chip:hover,
	.chip.active,
	.details-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
	}

	.selection-summary {
		border: 1px solid rgba(37, 99, 235, 0.18);
		background: rgba(37, 99, 235, 0.06);
		color: var(--text-primary);
	}

	.selection-summary.muted {
		border-style: dashed;
		color: var(--text-secondary);
	}

	.row-input:focus,
	.picker-trigger:focus,
	.details-toggle:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.editor-shell.invalid .row-input,
	.editor-shell.invalid .details-toggle,
	.editor-shell.invalid .preview-chip,
	.editor-shell.invalid .picker-trigger {
		border-color: var(--error);
	}

	@media screen and (max-width: 1762px) {
		.editor-grid {
			grid-template-columns: minmax(14rem, 1.25fr) minmax(8rem, 0.8fr) minmax(11rem, 1fr);
		}

		.toggle-field {
			grid-column: 1 / -1;
		}
	}

	@media screen and (max-width: 1586px) {
		.editor-grid {
			grid-template-columns: 1fr;
		}
	}

	@media screen and (max-width: 780px) {
		/*.editor-grid {*/
		/*	grid-template-columns: 1fr;*/
		/*}*/

		.guidance-strip {
			flex-direction: column;
			align-items: stretch;
		}

		.sentence-chip {
			width: fit-content;
		}

		.inline-input-wrap,
		.selection-block,
		.intro-input-wrap {
			min-width: 0;
			max-width: none;
			width: 100%;
		}
	}
</style>
