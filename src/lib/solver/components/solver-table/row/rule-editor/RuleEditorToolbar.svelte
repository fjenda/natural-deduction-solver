<script lang="ts">
	import type { RulePresentation } from '../../../../utils/rulePresentation';

	interface RuleEditorToolbarProps {
		selectedRulePresentation: RulePresentation | null;
		rulePickerOpen: boolean;
		ruleQuery: string;
		filteredRuleOptions: RulePresentation[];
		pickerPanelStyle: string;
		pickerTrigger?: HTMLButtonElement;
		pickerSearchInput?: HTMLInputElement;
		lineRefs: string;
		rowWarning: string;
		rulePreview: string;
		requiresQuantifierDetails: boolean;
		ruleDetailsOpen: boolean;
		isInvalid: boolean;
		onToggleRulePicker?: () => void | Promise<void>;
		onKeydown?: (event: KeyboardEvent) => void;
		onSearchKeydown?: (event: KeyboardEvent) => void;
		onSelectRule?: (code: string) => void;
		onLineInput?: () => void;
		onToggleRuleDetails?: () => void;
	}

	let {
		selectedRulePresentation,
		rulePickerOpen,
		ruleQuery = $bindable(),
		filteredRuleOptions,
		pickerPanelStyle,
		pickerTrigger = $bindable(),
		pickerSearchInput = $bindable(),
		lineRefs = $bindable(),
		rowWarning,
		rulePreview,
		requiresQuantifierDetails,
		ruleDetailsOpen,
		isInvalid,
		onToggleRulePicker,
		onKeydown,
		onSearchKeydown,
		onSelectRule,
		onLineInput,
		onToggleRuleDetails
	}: RuleEditorToolbarProps = $props();
</script>

<div class="editor-bar">
	<div class="editor-grid">
		<div class="field picker-field" class:invalid={isInvalid}>
			<span>Rule</span>
			<div class="field-control">
				<button
					id="rule-input"
					type="button"
					class="picker-trigger"
					bind:this={pickerTrigger}
					onclick={() => onToggleRulePicker?.()}
					onkeydown={onKeydown}
					aria-expanded={rulePickerOpen}
					aria-haspopup="listbox"
				>
					<span class="picker-copy-wrap">
						<span class="picker-symbol" class:placeholder={!selectedRulePresentation}>
							{selectedRulePresentation?.symbol ?? '∗'}
						</span>
						<span class="picker-copy">
							<span class="picker-code">{selectedRulePresentation?.code ?? 'Choose rule'}</span>
							<span class="picker-title">
								{selectedRulePresentation?.title ?? 'Search by code, symbol, or rule name'}
							</span>
						</span>
					</span>
					<i class={`fas ${rulePickerOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
				</button>
			</div>
			<span class="field-note">
				{selectedRulePresentation
					? 'Review the cited rows and substitution details before saving.'
					: 'Search by code, symbol, or rule name.'}
			</span>

			{#if rulePickerOpen}
				<div class="picker-panel" style={pickerPanelStyle}>
					<input
						bind:this={pickerSearchInput}
						class="row-input picker-search"
						type="text"
						bind:value={ruleQuery}
						onkeydown={onSearchKeydown}
						placeholder="Search rule picker"
					/>

					<div class="picker-options" role="listbox" aria-label="Rule picker options">
						{#each filteredRuleOptions as option (option.code)}
							<button
								type="button"
								class="picker-option"
								class:active={selectedRulePresentation?.code === option.code}
								onclick={() => onSelectRule?.(option.code)}
							>
								<span class="picker-option-symbol">{option.symbol}</span>
								<span class="picker-option-copy">
									<span class="picker-option-code">{option.code}</span>
									<span class="picker-option-title">{option.title}</span>
								</span>
							</button>
						{/each}

						{#if filteredRuleOptions.length === 0}
							<div class="empty-picker-state">No matching rule found.</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<label class="field compact-field" class:invalid={isInvalid}>
			<span>Rows</span>
			<span class="field-control">
				<input
					class="row-input compact"
					class:warning={rowWarning !== ''}
					type="text"
					bind:value={lineRefs}
					oninput={() => onLineInput?.()}
					onkeydown={onKeydown}
					placeholder="e.g. 1,2"
				/>
			</span>
			<span class:field-warning={rowWarning !== ''} class="field-note">
				{rowWarning || 'Cite supporting rows separated by commas.'}
			</span>
		</label>

		<div class="field compact-field" class:invalid={isInvalid}>
			<span>Status</span>
			<div class="field-control">
				<div class="preview-chip" class:muted={!rulePreview} title={rulePreview || 'Rule preview'}>
					<span class="preview-indicator" class:ready={!!rulePreview}></span>
					<span class="preview-value">{rulePreview || 'Preview updates here'}</span>
				</div>
			</div>
			<span class="field-note">
				{rulePreview
					? 'This is the rule that will be stored on the row.'
					: 'The preview updates as you edit the rule.'}
			</span>
		</div>

		{#if requiresQuantifierDetails}
			<div class="field compact-field" class:invalid={isInvalid}>
				<span>Substitution</span>
				<div class="field-control">
					<button
						type="button"
						class="details-toggle"
						onclick={() => onToggleRuleDetails?.()}
						aria-expanded={ruleDetailsOpen}
					>
						<i class={`fas ${ruleDetailsOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
						<span>{ruleDetailsOpen ? 'Hide card' : 'Open card'}</span>
					</button>
				</div>
				<span class="field-note">
					{ruleDetailsOpen
						? 'Substitution controls are shown below.'
						: 'Open the guided panel for quantifier replacement.'}
				</span>
			</div>
		{/if}
	</div>
</div>

<style>
	.editor-bar {
		padding: clamp(0.9rem, 1vw, 1.1rem);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0));
	}

	.editor-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.55fr) repeat(3, minmax(10.5rem, 1fr));
		gap: 0.9rem;
		align-items: start;
	}

	.field {
		display: grid;
		grid-template-rows: auto minmax(4.2rem, auto) minmax(1rem, auto);
		gap: 0.42rem;
		font-size: 0.78rem;
		color: var(--text-secondary);
		min-width: 0;
	}

	.field > span:first-child {
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 0.72rem;
	}

	.picker-field {
		position: relative;
	}

	.field-control {
		display: flex;
		align-items: stretch;
		min-width: 0;
	}

	.field-note {
		font-size: 0.72rem;
		line-height: 1.35;
		color: var(--text-secondary);
		min-height: 1rem;
	}

	.field-warning {
		color: var(--warning);
	}

	.row-input {
		width: 100%;
		font-size: 1em;
		min-height: 4.2rem;
		padding: 0.9rem 0.95rem;
		border: 1px solid var(--border);
		color: var(--text-primary);
		background: var(--surface);
		border-radius: var(--radius-md);
		transition: all var(--transition-base);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.row-input.warning {
		border-color: var(--warning);
	}

	.picker-trigger {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--spacing-sm);
		width: 100%;
		min-height: 4.2rem;
		padding: 0.75rem 0.95rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		text-align: left;
		transition: all var(--transition-base);
	}

	.picker-copy-wrap {
		display: flex;
		align-items: center;
		gap: 0.7rem;
		min-width: 0;
	}

	.picker-symbol,
	.picker-option-symbol {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.35rem;
		height: 2.35rem;
		padding: 0 0.4rem;
		border-radius: 999px;
		background: rgba(37, 99, 235, 0.1);
		color: var(--accent);
		font-weight: 700;
		font-size: 0.82rem;
		flex-shrink: 0;
	}

	.picker-symbol.placeholder {
		background: rgba(148, 163, 184, 0.12);
		color: var(--text-secondary);
	}

	.picker-copy,
	.picker-option-copy {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
	}

	.picker-code,
	.picker-option-code {
		font-weight: 700;
		font-size: 0.82rem;
		color: var(--text-primary);
	}

	.picker-title,
	.picker-option-title {
		font-size: 0.74rem;
		color: var(--text-secondary);
		line-height: 1.35;
	}

	.picker-panel {
		position: fixed;
		padding: var(--spacing-sm);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--surface-elevated);
		box-shadow: var(--shadow-lg);
		z-index: 200;
		overflow: hidden;
	}

	.picker-search {
		padding-block: 0.68rem;
		min-height: unset;
	}

	.picker-options {
		display: flex;
		flex-direction: column;
		flex: 1 1 auto;
		gap: 0.35rem;
		overflow: auto;
	}

	.picker-option {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		width: 100%;
		padding: 0.6rem 0.7rem;
		border-radius: var(--radius-md);
		border: 1px solid transparent;
		background: transparent;
		color: var(--text-primary);
		text-align: left;
	}

	.picker-option:hover,
	.picker-option.active {
		border-color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
	}

	.empty-picker-state {
		padding: 0.8rem 0.9rem;
		border-radius: var(--radius-md);
		font-size: 0.8rem;
		border: 1px dashed var(--border);
		color: var(--text-secondary);
	}

	.preview-chip,
	.details-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		min-height: 4.2rem;
		padding: 0.8rem 0.95rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border);
		background: var(--surface-elevated);
		color: var(--text-primary);
		transition: all var(--transition-base);
	}

	.preview-chip {
		overflow: hidden;
		justify-content: flex-start;
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.02);
	}

	.preview-indicator {
		width: 0.55rem;
		height: 0.55rem;
		border-radius: 999px;
		background: var(--text-secondary);
		opacity: 0.5;
		flex-shrink: 0;
	}

	.preview-indicator.ready {
		background: #22c55e;
		opacity: 1;
	}

	.preview-value {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.preview-chip.muted {
		color: var(--text-secondary);
	}

	.details-toggle {
		justify-content: center;
		font-size: 0.84rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.row-input:focus,
	.picker-trigger:focus,
	.details-toggle:focus {
		border-color: var(--accent);
		box-shadow:
			var(--shadow-md),
			0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.field.invalid .row-input,
	.field.invalid .details-toggle,
	.field.invalid .preview-chip,
	.field.invalid .picker-trigger {
		border-color: var(--error);
	}

	.details-toggle:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(37, 99, 235, 0.08);
	}

	@media screen and (max-width: 1400px) {
		.editor-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.picker-field {
			grid-column: 1 / -1;
		}
	}

	@media screen and (max-width: 980px) {
		.editor-grid {
			grid-template-columns: 1fr;
		}

		.picker-field {
			grid-column: auto;
		}
	}

	@media screen and (max-width: 780px) {
		.editor-bar {
			padding-inline: 0.9rem;
		}
	}
</style>

