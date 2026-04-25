<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import { switchMode, loadExample } from '../solver/actions/proofActions';
	import StyledDropdown from './StyledDropdown.svelte';
	import { ParseStrategy } from '../../types/ParseStrategy';
	import { editState, solving } from '../../stores/stateStore';
	import { EditState } from '../../types/EditState';
	import { starterExamples } from '../utils/starterExamples';
	import { onDestroy, onMount } from 'svelte';

	let { children } = $props();
	const MOBILE_BREAKPOINT = 950;

	let showExamples = $state(false);
	let examplesRef: HTMLDivElement | null = $state(null);
	let windowWidth = $state(MOBILE_BREAKPOINT + 1);
	const brandText = $derived(
		windowWidth <= MOBILE_BREAKPOINT ? 'NDS' : 'Natural Deduction Solver'
	);

	/**
	 * Closes the examples dropdown when clicking outside.
	 */
	const handleClickOutside = (event: MouseEvent) => {
		if (showExamples && examplesRef && !examplesRef.contains(event.target as Node)) {
			showExamples = false;
		}
	};

	/**
	 * Loads the selected example and closes the dropdown.
	 * @param example - the starter example to load
	 */
	const selectExample = (example: (typeof starterExamples)[0]) => {
		loadExample(example);
		showExamples = false;
	};

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

</script>

<svelte:window bind:innerWidth={windowWidth} />

<main>
	<nav>
		<ul class="nav-left">
			<li>
				<a href="/">{brandText}</a>
			</li>
			<div class="examples-menu" bind:this={examplesRef}>
				<button
					class="nav-button"
					onclick={() => (showExamples = !showExamples)}
					disabled={$solving}
				>
					<i class="fas fa-lightbulb"></i>
					Examples
					<i class="fas fa-chevron-down chevron" class:open={showExamples}></i>
				</button>
				{#if showExamples}
					<ul class="examples-dropdown">
						{#each starterExamples as example (example.name)}
							<li>
								<button class="example-item" onclick={() => selectExample(example)}>
									<span class="example-name">{example.name}</span>
									<span class="example-mode">
										{example.mode === 'PROPOSITIONAL' ? 'Prop' : 'Pred'}
									</span>
									<span class="example-formula">
										{example.premises.join(', ')} ⊢ {example.conclusion}
									</span>
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</ul>
		<ul class="nav-right">
			<li>
				<StyledDropdown
					label="Switch Mode"
					options={[ParseStrategy.PREDICATE, ParseStrategy.PROPOSITIONAL]}
					onSelect={switchMode}
					disabled={$editState === EditState.THEOREM || $solving}
				/>
			</li>
			<li>
				<ThemeToggle />
			</li>
		</ul>
	</nav>
	{@render children()}
</main>

<style>
	main {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--surface);
		border-bottom: 1px solid var(--border);
		padding: 0;
		font-size: 1.05rem;
		height: 3.5rem;
		transition: all var(--transition-base);
		position: relative;
		z-index: 50;
		flex-shrink: 0;
	}

	nav::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--accent), transparent);
		opacity: 0.35;
	}

	.nav-left,
	.nav-right {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--spacing-md);
		margin: 0;
		padding: 0 var(--spacing-xl);
	}

	nav a {
		text-decoration: none;
		color: var(--text-primary);
		font-weight: 600;
		transition: color var(--transition-base);
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		padding: var(--spacing-sm) 0;
	}

	nav a:hover {
		color: var(--accent);
	}

	.examples-menu {
		position: relative;
	}

	.nav-button {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs);
		padding: 0.45rem 0.85rem;
		font-size: 0.85rem;
		border-radius: var(--radius-md);
		background: var(--button-bg);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-base);
	}

	.nav-button:hover:not(:disabled) {
		background: var(--button-hover);
		border-color: var(--accent);
		color: var(--accent);
	}

	.nav-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.nav-button i:first-child {
		color: var(--warning);
	}

	.chevron {
		font-size: 0.7rem;
		transition: transform var(--transition-fast);
		color: var(--text-secondary);
	}

	.chevron.open {
		transform: rotate(180deg);
	}

	.examples-dropdown {
		position: absolute;
		top: calc(100% + var(--spacing-sm));
		left: 0;
		background: var(--surface);
		list-style: none;
		margin: 0;
		padding: var(--spacing-xs) 0;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border);
		box-shadow: var(--shadow-lg);
		z-index: 100;
		min-width: 320px;
		max-height: 400px;
		overflow-y: auto;
		animation: slideDown var(--transition-fast) ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.examples-dropdown li {
		margin: 0;
	}

	.example-item {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		width: 100%;
		padding: var(--spacing-sm) var(--spacing-lg);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		transition: all var(--transition-fast);
		border-radius: 0;
		color: var(--text-primary);
		position: relative;
	}

	.example-item:hover {
		background: var(--accent-subtle);
	}

	.example-name {
		font-weight: 600;
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.example-mode {
		position: absolute;
		right: var(--spacing-md);
		top: var(--spacing-sm);
		font-size: 0.7rem;
		color: var(--accent);
		background: rgba(99, 102, 241, 0.1);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}

	.example-formula {
		font-size: 0.8rem;
		color: var(--text-secondary);
		font-family: monospace;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 100%;
	}
</style>
