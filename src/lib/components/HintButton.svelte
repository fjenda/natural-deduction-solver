<script lang="ts">
	import { fade } from 'svelte/transition';
	import { getHintRules, getTextHint, type HintRule } from '../solver/services/hintService';
	import { selectedRows, solverContent } from '../../stores/solverStore';

	let hints = $state<HintRule[]>([]);
	let textHint = $state('');
	let loading = $state(false);
	let showHint = $state(false);

	async function updateHints() {
		if (!$solverContent.proof.length) {
			hints = [];
			textHint = 'Start a proof to see suggested next steps.';
			return;
		}

		loading = true;

		try {
			const [nextHints, nextTextHint] = await Promise.all([getHintRules(), getTextHint()]);
			hints = nextHints;
			textHint = nextTextHint;
		} catch {
			hints = [];
			textHint = 'Unable to generate hints right now.';
		} finally {
			loading = false;
		}
	}

	async function toggleHint() {
		showHint = !showHint;

		if (showHint) {
			await updateHints();
		}
	}

	$effect(() => {
		$solverContent.proof;
		$selectedRows;

		if (showHint) {
			updateHints();
		}
	});
</script>

<div class="hint-panel">
	<button
		class="hint-button"
		class:loading={loading}
		type="button"
		onclick={toggleHint}
		aria-label="Toggle proof hints"
		aria-expanded={showHint}
	>
		{#if loading}
			<span class="loading-spinner" aria-hidden="true"></span>
		{:else}
			<i class="fas fa-lightbulb hint-icon" aria-hidden="true"></i>
		{/if}
		<span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
	</button>

	{#if showHint}
		<section class="hint-card" transition:fade>
			<div class="hint-card-header">
				<h3>Proof Hint</h3>
				{#if $selectedRows.length > 0}
					<span class="selection-badge">Selected: {$selectedRows.join(', ')}</span>
				{/if}
			</div>

			{#if loading}
				<p class="hint-copy">Looking for the best next proof step...</p>
			{:else}
				<p class="hint-copy">{textHint}</p>

				{#if hints.length > 0}
					<ul class="hint-list">
						{#each hints.slice(0, 3) as hint (hint.rule.short)}
							<li class="hint-item">
								<div class="hint-rule-row">
									<strong>{hint.rule.title}</strong>
									<span class="hint-rule-short">{hint.rule.short}</span>
								</div>
								<p class="hint-item-message">{hint.message}</p>
								{#if hint.applicableRows.length > 0}
									<div class="hint-meta">
										Focus on row{hint.applicableRows.length > 1 ? 's' : ''}
										{hint.applicableRows.join(', ')}
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		</section>
	{/if}
</div>

<style>
	.hint-panel {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		width: 100%;
	}

	.hint-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		align-self: flex-start;
		min-height: 2.75rem;
		padding: 0.65rem 1rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--button-bg);
		color: var(--text-primary);
		box-shadow: var(--shadow-sm);
		transition: all var(--transition-base);
	}

	.hint-button:hover:not(:disabled) {
		border-color: var(--accent);
		color: var(--accent);
	}

	.hint-button.loading {
		cursor: wait;
	}

	.hint-icon {
		color: var(--warning);
	}

	.loading-spinner {
		width: 1rem;
		height: 1rem;
		border: 2px solid var(--border-light);
		border-top-color: var(--accent);
		border-radius: 999px;
		animation: spin 0.8s linear infinite;
	}

	.hint-card {
		width: 100%;
		max-width: 100%;
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-sm);
		overflow-wrap: anywhere;
	}

	.hint-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-sm);
	}

	.hint-card-header h3 {
		margin: 0;
		font-size: 1rem;
	}

	.selection-badge {
		font-size: 0.75rem;
		color: var(--accent);
		background: var(--accent-subtle);
		padding: 0.2rem 0.45rem;
		border-radius: var(--radius-sm);
	}

	.hint-copy {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}

	.hint-list {
		margin: var(--spacing-md) 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.hint-item {
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
	}

	.hint-item-message {
		margin: var(--spacing-xs) 0 0;
		font-size: 0.88rem;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.hint-rule-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
	}

	.hint-rule-short {
		font-size: 0.75rem;
		color: var(--accent);
	}

	.hint-meta {
		margin-top: var(--spacing-xs);
		font-size: 0.85rem;
		color: var(--text-secondary);
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@media screen and (max-width: 600px) {
		.hint-button {
			width: 100%;
			justify-content: center;
		}

		.hint-card-header,
		.hint-rule-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
