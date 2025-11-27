<script lang="ts">
	import { type DeductionRule, NDRule } from '../DeductionRule';
	import { highlightedRows, selectedRows } from '../../../stores/solverStore';
	import Tooltip from '../../components/Tooltip.svelte';
	import { get } from 'svelte/store';
	import { showToast } from '../../utils/showToast';
	import { usable } from '../../solver/services/proofService';

	interface RuleSlotProps {
		rule: DeductionRule;
		onClick: () => void;
		onMouseOver: () => void;
		onMouseOut: () => void;
	}

	let { rule, onClick, onMouseOver, onMouseOut }: RuleSlotProps = $props();

	let showTooltip: boolean = $state(false);

	const handleClick = async (e: Event) => {
		e.preventDefault();

		if (get(selectedRows).length === 0) {
			return showToast('Select at least one row', 'warning');
		}

		const result = await usable(rule, get(selectedRows)[0]);
		if (!result.applicable && rule.short !== NDRule.IDIS) return;

		highlightedRows.set(result.highlighted);
		onClick();
		highlightedRows.set([]);
	};

	const handleMouseOver = () => {
		onMouseOver();
		showTooltip = true;
	};

	const handleMouseOut = () => {
		onMouseOut();
		showTooltip = false;
	};
</script>

<div class="wrapper">
	<Tooltip content={rule.detail} position="bottom" show={showTooltip} />
	<button
		class="rule-slot"
		title={rule.title}
		onmouseenter={handleMouseOver}
		onfocus={handleMouseOver}
		onmouseleave={handleMouseOut}
		onblur={handleMouseOut}
		onmousedown={handleClick}
	>
		{rule.short}
	</button>
</div>

<style>
	.wrapper {
		width: 25%;
		max-width: 5rem;
		position: relative;
	}

	.rule-slot {
		font-size: 1.25rem;
		width: 100%;
		aspect-ratio: 1;
		padding: 1rem;
		cursor: pointer;
		border-radius: 0.5rem;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
	}

	.rule-slot:hover,
	.rule-slot:focus {
		border: 1px solid var(--border);
	}

	@media screen and (max-width: 1200px) {
		.wrapper {
			width: 33%;
		}
	}
</style>
