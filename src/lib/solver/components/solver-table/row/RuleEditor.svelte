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
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		height: auto;
	}
</style>
