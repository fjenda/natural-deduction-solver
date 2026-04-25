<script lang="ts">
	import type {
		AppliedRuleReplacement,
		RuleReplacementKind
	} from '../../../../../../types/AppliedRule';
	import type { RulePresentation } from '../../../../utils/rulePresentation';
	import { NDRule } from '../../../../../rules/DeductionRule';

	interface QuantifierEliminationCardProps {
		selectedRulePresentation: RulePresentation | null;
		detailsLabel: string;
		detailActionText: string;
		citedLine?: number;
		citedQuantifierReplacement: AppliedRuleReplacement | null;
		eliminationTerm: string;
		normalizedRuleName: string;
		eliminationTermKind: RuleReplacementKind;
		eliminationKindOptions: Array<{ key: RuleReplacementKind; label: string }>;
		isInvalid: boolean;
		onTermInput?: () => void;
		onKeydown?: (event: KeyboardEvent) => void;
		onKindSelect?: (kind: RuleReplacementKind) => void;
	}

	let {
		selectedRulePresentation,
		detailsLabel,
		detailActionText,
		citedLine,
		citedQuantifierReplacement,
		eliminationTerm = $bindable(),
		normalizedRuleName,
		eliminationTermKind,
		eliminationKindOptions,
		isInvalid,
		onTermInput,
		onKeydown,
		onKindSelect
	}: QuantifierEliminationCardProps = $props();
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

	<div class="details-grid details-grid-elimination">
		<div class="detail-group detail-group-compact">
			<span class="detail-group-label">Cited row</span>
			<span class="sentence-chip">row {citedLine || '—'}</span>
		</div>
		<div class="detail-group detail-group-compact">
			<span class="detail-group-label">Bound symbol</span>
			<span class="sentence-chip" class:empty={!citedQuantifierReplacement}>
				{citedQuantifierReplacement?.value ?? 'quantified variable'}
			</span>
		</div>
		<label class="detail-group detail-group-input">
			<span class="detail-group-label">Instantiate as</span>
			<input
				class="row-input inline-input"
				type="text"
				bind:value={eliminationTerm}
				oninput={() => onTermInput?.()}
				onkeydown={onKeydown}
				placeholder={normalizedRuleName === NDRule.EEX ? 'e.g. a' : 'e.g. a or f(a)'}
			/>
		</label>
	</div>

	{#if normalizedRuleName === NDRule.EEX}
		<div class="helper-banner">
			<i class="fas fa-sparkles"></i>
			<span>Name a constant that does not already appear in the proof.</span>
		</div>
	{:else}
		<div class="option-group">
			<span class="option-group-label">Term type</span>
			<span class="option-group-copy">
				Choose whether the substitution is a variable, a constant, or a compound term.
			</span>
			<div class="chip-group" role="group" aria-label="Replacement kind">
				{#each eliminationKindOptions as option (option.key)}
					<button
						type="button"
						class="chip"
						class:active={eliminationTermKind === option.key}
						onclick={() => onKindSelect?.(option.key)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
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

	.details-grid-elimination .detail-group-compact {
		grid-column: span 2;
	}

	.details-grid-elimination .detail-group-input {
		grid-column: span 8;
	}

	.detail-group {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		min-width: 0;
	}

	.detail-group-label,
	.option-group-label {
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

	.sentence-chip.empty {
		color: var(--text-secondary);
		border-style: dashed;
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

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		min-width: 0;
	}

	.option-group-copy {
		font-size: 0.78rem;
		line-height: 1.45;
		color: var(--text-secondary);
	}

	.helper-banner {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid rgba(34, 197, 94, 0.2);
		background: rgba(34, 197, 94, 0.08);
		font-size: 0.84rem;
		line-height: 1.5;
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
	.chip.active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
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
		.details-grid-elimination .detail-group-compact,
		.details-grid-elimination .detail-group-input {
			grid-column: span 6;
		}
	}

	@media screen and (max-width: 980px) {
		.details-grid {
			grid-template-columns: 1fr;
		}

		.details-grid-elimination .detail-group-compact,
		.details-grid-elimination .detail-group-input {
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
