<script lang="ts">
	import { NodeType } from '../../../../../syntax-checker/NodeType';
	import type { RuleReplacementKind } from '../../../../../../types/AppliedRule';
	import type { RulePresentation } from '../../../../utils/rulePresentation';

	interface IntroductionSource {
		key: string;
		value: string;
		kind: RuleReplacementKind;
		label: string;
	}

	interface QuantifierIntroductionCardProps {
		selectedRulePresentation: RulePresentation | null;
		detailsLabel: string;
		detailActionText: string;
		citedLine?: number;
		introductionSources: IntroductionSource[];
		introductionSourceKey: string;
		introductionVariable: string;
		isInvalid: boolean;
		onSourceSelect?: (key: string) => void;
		onVariableInput?: () => void;
		onKeydown?: (event: KeyboardEvent) => void;
	}

	let {
		selectedRulePresentation,
		detailsLabel,
		detailActionText,
		citedLine,
		introductionSources,
		introductionSourceKey,
		introductionVariable = $bindable(),
		isInvalid,
		onSourceSelect,
		onVariableInput,
		onKeydown
	}: QuantifierIntroductionCardProps = $props();

	const selectedIntroductionSource = $derived.by(
		() => introductionSources.find((entry) => entry.key === introductionSourceKey) ?? null
	);
	const summaryText = $derived.by(() => {
		if (!selectedIntroductionSource || !introductionVariable.trim()) {
			return 'Choose a cited symbol and the variable name you want the quantifier to bind.';
		}

		return `Generalizing ${selectedIntroductionSource.label} into variable ${introductionVariable.trim()}.`;
	});
</script>

<div class="details-card" class:invalid={isInvalid}>
	<div class="details-header">
		<div class="detail-title-row">
			<span class="detail-badge">{selectedRulePresentation?.symbol ?? '∀/∃'}</span>
			<div class="detail-copy">
				<div class="detail-title">{detailsLabel}</div>
				<div class="detail-subtitle">{detailActionText}</div>
			</div>
		</div>
	</div>

	<div class="details-grid details-grid-introduction">
		<div class="detail-group detail-group-compact">
			<span class="detail-group-label">Cited row</span>
			<span class="sentence-chip">row {citedLine || '—'}</span>
		</div>
		<div class="detail-group detail-group-wide">
			<span class="detail-group-label">Replace symbol</span>
			{#if introductionSources.length > 0}
				<div class="chip-group" role="group" aria-label="Choose source symbol">
					{#each introductionSources as source (source.key)}
						<button
							type="button"
							class="chip"
							class:active={introductionSourceKey === source.key}
							onclick={() => onSourceSelect?.(source.key)}
						>
							<span>{source.value}</span>
							<span class="chip-kind">
								{source.kind === 'constant' || source.key.startsWith(`${NodeType.CONSTANT}:`)
									? 'constant'
									: 'variable'}
							</span>
						</button>
					{/each}
				</div>
			{:else}
				<div class="empty-state">No constants or variables found in the cited row.</div>
			{/if}
		</div>
		<label class="detail-group detail-group-input detail-group-compact">
			<span class="detail-group-label">New variable</span>
			<input
				class="row-input inline-input"
				type="text"
				bind:value={introductionVariable}
				oninput={() => onVariableInput?.()}
				onkeydown={onKeydown}
				placeholder="e.g. x"
			/>
		</label>
	</div>

	<div
		class="selection-summary"
		class:muted={!selectedIntroductionSource && !introductionVariable.trim()}
	>
		{summaryText}
	</div>
</div>

<style>
	.details-card {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.15rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0));
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.details-header {
		display: flex;
		justify-content: center;
		gap: 0.35rem;
	}

	.detail-title-row {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.detail-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.35rem;
		height: 2.35rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: rgba(37, 99, 235, 0.1);
		color: var(--accent);
		font-weight: 700;
		font-size: 0.82rem;
		flex-shrink: 0;
	}

	.detail-copy {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
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

	.details-grid {
		display: grid;
		grid-template-columns: repeat(12, minmax(0, 1fr));
		gap: 0.9rem;
		padding: 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: rgba(255, 255, 255, 0.025);
	}

	.details-grid-introduction .detail-group-compact {
		grid-column: span 3;
	}

	.details-grid-introduction .detail-group-wide {
		grid-column: span 6;
	}

	.detail-group {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		min-width: 0;
	}

	.detail-group-label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-secondary);
	}

	.detail-group-input {
		justify-content: space-between;
	}

	.sentence-chip {
		display: inline-flex;
		align-items: center;
		justify-content: center;
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

	.row-input {
		width: 100%;
		font-size: 1em;
		min-height: 3.5rem;
		padding: 0.9rem 0.95rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.chip-group {
		display: flex;
		flex-wrap: wrap;
		gap: var(--spacing-xs);
		min-width: 0;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
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

	.chip-kind {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-secondary);
	}

	.chip:hover,
	.chip.active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
	}

	.empty-state,
	.selection-summary {
		padding: 0.8rem 0.9rem;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
	}

	.empty-state {
		border: 1px dashed var(--border);
		color: var(--text-secondary);
	}

	.selection-summary {
		padding: 0.9rem 1rem;
		border: 1px solid rgba(37, 99, 235, 0.18);
		background: rgba(37, 99, 235, 0.06);
		color: var(--text-primary);
		line-height: 1.5;
	}

	.selection-summary.muted {
		border-style: dashed;
		color: var(--text-secondary);
	}

	.row-input:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.details-card.invalid .row-input {
		border-color: var(--error);
	}

	@media screen and (max-width: 1400px) {
		.details-grid-introduction .detail-group-compact,
		.details-grid-introduction .detail-group-wide {
			grid-column: span 6;
		}
	}

	@media screen and (max-width: 980px) {
		.details-grid {
			grid-template-columns: 1fr;
		}

		.details-grid-introduction .detail-group-compact,
		.details-grid-introduction .detail-group-wide {
			grid-column: auto;
		}
	}

	@media screen and (max-width: 780px) {
		.details-card,
		.details-grid {
			padding-inline: 0.9rem;
		}

		.sentence-chip {
			justify-content: flex-start;
		}
	}
</style>
