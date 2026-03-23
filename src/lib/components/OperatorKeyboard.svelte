<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { logicMode } from '../../stores/solverStore';
	import { ParseStrategy } from '../../types/ParseStrategy';

	interface OperatorKeyboardProps {
		/** Slot content (the input element to attach the keyboard to) */
		children: import('svelte').Snippet;
	}

	let { children }: OperatorKeyboardProps = $props();

	let container: HTMLDivElement | null = $state(null);
	let focusedInput: HTMLInputElement | HTMLTextAreaElement | null = $state(null);
	let visible = $state(false);
	let barStyle = $state('');

	/**
	 * Logical operators grouped by category.
	 * Propositional operators are always shown; quantifiers are added in predicate mode.
	 */
	const propositionalOps = [
		{ symbol: '¬', label: '¬', title: 'Negation' },
		{ symbol: '∧', label: '∧', title: 'Conjunction' },
		{ symbol: '∨', label: '∨', title: 'Disjunction' },
		{ symbol: '⊃', label: '⊃', title: 'Implication' },
		{ symbol: '≡', label: '≡', title: 'Equivalence' }
	];

	const quantifierOps = [
		{ symbol: '∀', label: '∀', title: 'Universal' },
		{ symbol: '∃', label: '∃', title: 'Existential' }
	];

	const bracketOps = [
		{ symbol: '(', label: '(', title: 'Open paren' },
		{ symbol: ')', label: ')', title: 'Close paren' },
		{ symbol: '[', label: '[', title: 'Open bracket' },
		{ symbol: ']', label: ']', title: 'Close bracket' }
	];

	/**
	 * The operators to display based on the current logic mode.
	 */
	const operators = $derived(
		$logicMode === ParseStrategy.PROPOSITIONAL
			? [...propositionalOps, ...bracketOps]
			: [...propositionalOps, ...quantifierOps, ...bracketOps]
	);

	/**
	 * Positions the keyboard bar below the focused input using fixed coordinates.
	 * This escapes any overflow:hidden ancestors.
	 */
	const updatePosition = () => {
		if (!focusedInput) return;

		const inputRect = focusedInput.getBoundingClientRect();

		// position using fixed so the bar escapes overflow:hidden ancestors
		barStyle = `position:fixed; left:${inputRect.left}px; top:${inputRect.bottom}px; width:${inputRect.width}px;`;
	};

	/**
	 * Inserts an operator symbol at the current cursor position of the focused input.
	 * @param operator - the symbol to insert
	 */
	const insertOperator = (operator: string) => {
		if (!focusedInput) return;

		const start = focusedInput.selectionStart ?? 0;
		const end = focusedInput.selectionEnd ?? start;
		const value = focusedInput.value;

		const newValue = value.slice(0, start) + operator + value.slice(end);
		focusedInput.value = newValue;

		// fire input event so Svelte bindings update
		focusedInput.dispatchEvent(new Event('input', { bubbles: true }));

		// restore focus and cursor position
		const newPos = start + operator.length;
		requestAnimationFrame(() => {
			focusedInput?.focus();
			focusedInput?.setSelectionRange(newPos, newPos);
		});
	};

	/**
	 * Detects when focus enters the container to show the keyboard.
	 * @param event - the focus event
	 */
	const handleFocusIn = (event: FocusEvent) => {
		const target = event.target;
		if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
			focusedInput = target;
			visible = true;
			updatePosition();
		}
	};

	/**
	 * Hides the keyboard when focus leaves the container entirely.
	 * @param event - the focus event
	 */
	const handleFocusOut = (event: FocusEvent) => {
		const related = event.relatedTarget;
		if (container && related instanceof Node && container.contains(related)) {
			return;
		}
		visible = false;
		focusedInput = null;
		barStyle = '';
	};

	/**
	 * Prevents mousedown from stealing focus from the input.
	 * @param event - the mouse event
	 */
	const handleButtonMousedown = (event: MouseEvent) => {
		event.preventDefault();
	};

	/**
	 * Repositions the bar on scroll/resize.
	 */
	const handleScroll = () => {
		if (visible && focusedInput) {
			updatePosition();
		}
	};

	onMount(() => {
		window.addEventListener('scroll', handleScroll, true);
		window.addEventListener('resize', handleScroll);
	});

	onDestroy(() => {
		window.removeEventListener('scroll', handleScroll, true);
		window.removeEventListener('resize', handleScroll);
	});
</script>

<div
	class="operator-keyboard-wrapper"
	bind:this={container}
	onfocusin={handleFocusIn}
	onfocusout={handleFocusOut}
>
	{@render children()}
</div>

{#if visible}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="keyboard-bar" style={barStyle} onmousedown={handleButtonMousedown}>
		{#each operators as op (op.symbol)}
			<button class="key" type="button" onclick={() => insertOperator(op.symbol)} title={op.title}>
				{op.label}
			</button>
		{/each}
	</div>
{/if}

<style>
	.operator-keyboard-wrapper {
		position: relative;
		width: 100%;
	}

	.keyboard-bar {
		z-index: 9999;
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding: var(--spacing-sm);
		border: 1px solid var(--border);
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		background: var(--surface);
		box-shadow: var(--shadow-lg);
		animation: slideDown 0.15s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2rem;
		height: 2rem;
		padding: 0 var(--spacing-sm);
		font-family: 'Cambria Math', 'STIX Two Math', serif;
		font-size: 1.15rem;
		line-height: 1;
		color: var(--text-primary);
		background: var(--button-bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-base);
		user-select: none;
	}

	.key:hover {
		color: var(--accent);
		border-color: var(--accent);
		background: var(--button-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}

	.key:active {
		transform: translateY(0);
		box-shadow: none;
		background: var(--accent);
		color: white;
		border-color: var(--accent);
	}

	@media screen and (max-width: 950px) {
		.keyboard-bar {
			padding: var(--spacing-xs);
			gap: 3px;
		}

		.key {
			min-width: 1.75rem;
			height: 1.75rem;
			font-size: 1rem;
		}
	}
</style>
