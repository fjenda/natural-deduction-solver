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
			<li><a href="/"> Natural Deduction Solver </a></li>
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
		font-size: 1.2rem;
		height: 4rem;
		transition: all var(--transition-base);
	}

	nav ul {
		list-style: none;
		display: flex;
		align-items: center;
		gap: var(--spacing-lg);
		margin: 0;
		padding: 0 var(--spacing-xl);
	}

	nav a {
		text-decoration: none;
		color: var(--text-primary);
		font-weight: 600;
		transition: color var(--transition-base);
		position: relative;
		padding: var(--spacing-sm) 0;
	}

	nav a::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 2px;
		background: var(--accent);
		transition: width var(--transition-base);
	}

	nav a:hover {
		color: var(--accent);
	}

	nav a:hover::after {
		width: 100%;
	}
</style>
