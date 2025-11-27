<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import { switchMode } from '../solver/actions/proofActions';
	import StyledDropdown from './StyledDropdown.svelte';
	import { ParseStrategy } from '../../types/ParseStrategy';

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
		padding: 0.5rem 0;
		font-size: 1.2rem;
		height: 4rem;
	}

	nav ul {
		list-style: none;
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 0;
		padding: 0 2rem;
	}

	nav a {
		text-decoration: none;
		color: var(--text-primary);
		font-weight: bold;
	}

	nav a:hover {
		color: var(--accent);
	}
</style>
