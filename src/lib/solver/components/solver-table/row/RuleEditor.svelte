<script lang="ts">
	import { type AppliedRule, appliedRuleToString } from '../../../../../types/AppliedRule';

	interface RuleEditorProps {
		ruleText: string;
		rule: AppliedRule;
		editable: boolean;
	}

	let { ruleText = $bindable(), rule, editable }: RuleEditorProps = $props();
</script>

{#if editable}
	<input id="rule-input" class="row-input" type="text" bind:value={ruleText} />
{:else}
	{appliedRuleToString(rule)}
{/if}

<style>
	.row-input {
		width: 100%;
		font-size: 1em;
		max-width: 8rem;
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		height: auto;
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
	}

	.row-input:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}
</style>
