<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import { switchMode } from '../solver/actions/proofActions';
	import StyledDropdown from './StyledDropdown.svelte';
	import { ParseStrategy } from '../../types/ParseStrategy';
	import { editState, solving } from '../../stores/stateStore';
	import { EditState } from '../../types/EditState';

	let { children } = $props();
</script>

<main>
	<nav>
		<ul>
			<li>
				<a href="/"> Natural Deduction Solver</a>
			</li>
		</ul>
		<ul>
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
		box-shadow: var(--shadow-sm);
		padding: 0;
		font-size: 1.05rem;
		height: 3.5rem;
		transition: all var(--transition-base);
		position: relative;
	}

	nav::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--accent), transparent);
		opacity: 0.4;
	}

	nav ul {
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

	nav a svg {
		color: var(--accent);
		flex-shrink: 0;
	}

	nav a:hover {
		color: var(--accent);
	}
</style>
