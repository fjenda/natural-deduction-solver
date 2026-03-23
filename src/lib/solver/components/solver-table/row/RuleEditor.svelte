<script lang="ts">
	import { type AppliedRule, appliedRuleToString } from '../../../../../types/AppliedRule';
	import { DeductionRule } from '../../../../rules/DeductionRule';
	import { PrettySyntaxer } from '../../../parsers/PrettySyntaxer';

	interface RuleEditorProps {
		ruleText: string;
		rule: AppliedRule;
		editable: boolean;
		onEnter?: () => void;
	}

	let { ruleText = $bindable(), rule, editable, onEnter }: RuleEditorProps = $props();

	let isValid = $state(true);

	/**
	 * Validates the rule text in real-time.
	 * Checks that the rule name is a known deduction rule or a valid format.
	 */
	const validateRule = () => {
		const trimmed = ruleText.trim();
		if (!trimmed) {
			isValid = true;
			return;
		}

		const cleaned = PrettySyntaxer.cleanupRule(trimmed);
		const parts = cleaned.split(' ');
		const ruleName = parts[0].toUpperCase();

		// valid if it's a known deduction rule (PREM, CONC, or any NDRule)
		isValid =
			ruleName === 'PREM' ||
			ruleName === 'CONC' ||
			DeductionRule.rules.some((r) => r.short === ruleName);
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
</script>

{#if editable}
	<input
		id="rule-input"
		class="row-input"
		class:invalid={!isValid}
		type="text"
		bind:value={ruleText}
		oninput={validateRule}
		onkeydown={handleKeydown}
		placeholder="e.g. EC 1,2"
	/>
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

	.row-input.invalid {
		border-color: var(--error);
	}

	.row-input.invalid:focus {
		border-color: var(--error);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(239, 68, 68, 0.1);
	}
</style>
