<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { logicMode } from '../../stores/solverStore';
	import { ParseStrategy } from '../../types/ParseStrategy';

	interface OperatorKeyboardProps {
		/** Slot content (the input element to attach the keyboard to) */
		children: import('svelte').Snippet;
		/**
		 * When true the keyboard bar is rendered inline (normal block flow) instead of
		 * being teleported to a fixed overlay. Use this inside modals / scrollable cards
		 * to avoid the reserved-space gap.
		 */
		inline?: boolean;
		/** Use tighter spacing and visually attach the keyboard to modal inputs. */
		compact?: boolean;
	}

	let { children, inline = false, compact = false }: OperatorKeyboardProps = $props();

	let container: HTMLDivElement | null = $state(null);
	let focusedInput: HTMLInputElement | HTMLTextAreaElement | null = $state(null);
	let barElement: HTMLDivElement | null = $state(null);
	let visible = $state(false);
	let barStyle = $state('');
	let reservedHeight = $state(0);

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

		requestAnimationFrame(() => {
			reservedHeight = (barElement?.offsetHeight ?? 0) + 8;
		});
	};

	/**
	 * Inserts an operator symbol at the current cursor position of the focused input.
	 * @param operator - the symbol to insert
	 */
	const insertOperator = (operator: string) => {
		if (!focusedInput) return;

		const start = focusedInput.selectionStart ?? 0;
		const end = focusedInput.selectionEnd ?? start;
		focusedInput.value =
			focusedInput.value.slice(0, start) + operator + focusedInput.value.slice(end);

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
		reservedHeight = 0;
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
	class:keyboard-visible={visible}
	class:compact={compact}
	style={inline ? '' : `padding-bottom:${visible ? reservedHeight : 0}px;`}
	bind:this={container}
	onfocusin={handleFocusIn}
	onfocusout={handleFocusOut}
>
	{@render children()}

	{#if inline}
		<div class="inline-shell" class:visible={visible} class:compact-shell={compact} aria-hidden={!visible}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="keyboard-bar inline-bar" class:compact-bar={compact} onmousedown={handleButtonMousedown}>
				{#each operators as op (op.symbol)}
					<button class="key" type="button" onclick={() => insertOperator(op.symbol)} title={op.title}>
						{op.label}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

{#if visible && !inline}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="keyboard-bar" bind:this={barElement} style={barStyle} onmousedown={handleButtonMousedown}>
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
		transition: padding-bottom var(--transition-base);
	}

	.operator-keyboard-wrapper.compact {
		display: grid;
		gap: 0;
	}

	.operator-keyboard-wrapper.compact.keyboard-visible :global(input),
	.operator-keyboard-wrapper.compact.keyboard-visible :global(textarea) {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.inline-shell {
		display: grid;
		grid-template-rows: 0fr;
		overflow: hidden;
		opacity: 0;
		transform: translateY(-6px);
		transition:
			grid-template-rows 180ms ease,
			opacity 160ms ease,
			transform 180ms ease;
		pointer-events: none;
	}

	.inline-shell > .keyboard-bar {
		min-height: 0;
	}

	.inline-shell.visible {
		grid-template-rows: 1fr;
		opacity: 1;
		transform: translateY(0);
		pointer-events: auto;
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

	/* Inline variant: renders as a normal block inside the wrapper, no fixed overlay */
	.keyboard-bar.inline-bar {
		position: static;
		z-index: auto;
		box-shadow: var(--shadow-sm);
		border-top: none;
		animation: none;
	}

	.keyboard-bar.inline-bar.compact-bar {
		gap: 0.35rem;
		padding: 0.45rem;
		border-top: none;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		box-shadow: none;
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

	.compact-bar .key {
		min-width: 1.9rem;
		height: 1.9rem;
		padding: 0 0.45rem;
		font-size: 1.05rem;
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
