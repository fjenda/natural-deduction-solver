<script lang="ts">
	import CustomModal, { type CustomModalProps } from './CustomModal.svelte';
	import { solverContent } from '../../stores/solverStore';
	import {
		exportToLatex,
		exportToTxt,
		downloadFile,
		copyToClipboard
	} from '../solver/utils/exportProof';
	import { showToast } from '../utils/showToast';

	type ExportProofModalProps = CustomModalProps;

	const { id, index, isOpen, close, title }: ExportProofModalProps = $props();

	type ExportFormat = 'latex' | 'txt';
	let selectedFormat = $state<ExportFormat>('latex');
	let copied = $state(false);

	const latexContent = $derived(exportToLatex($solverContent));
	const txtContent = $derived(exportToTxt($solverContent));
	const currentContent = $derived(selectedFormat === 'latex' ? latexContent : txtContent);

	const handleCopy = async () => {
		await copyToClipboard(currentContent);
		copied = true;
		showToast('Copied to clipboard!', 'success');
		setTimeout(() => (copied = false), 2000);
	};

	const handleDownload = () => {
		const ext = selectedFormat === 'latex' ? 'tex' : 'txt';
		const mime = selectedFormat === 'latex' ? 'application/x-tex' : 'text/plain';
		downloadFile(currentContent, `proof.${ext}`, mime);
		showToast(`Downloaded proof.${ext}`, 'success');
	};
</script>

<CustomModal {isOpen} {close} {title} {id} {index}>
	{#snippet body()}
		<div class="format-selector">
			<button
				type="button"
				class="format-btn"
				class:active={selectedFormat === 'latex'}
				onclick={() => (selectedFormat = 'latex')}
			>
				<i class="fa-regular fa-file"></i>

				LaTeX
			</button>
			<button
				type="button"
				class="format-btn"
				class:active={selectedFormat === 'txt'}
				onclick={() => (selectedFormat = 'txt')}
			>
				<i class="fa-regular fa-file-lines"></i>
				Plain Text
			</button>
		</div>

		<div class="preview-container">
			<pre class="preview">{currentContent}</pre>
		</div>
	{/snippet}

	{#snippet buttons()}
		<div>
			<button class="button secondary" onclick={handleCopy}>
				{#if copied}
					<i class="fa-solid fa-check"></i>
					Copied!
				{:else}
					<i class="fa-regular fa-copy"></i>
					Copy
				{/if}
			</button>
			<button class="button" onclick={handleDownload}>
				<i class="fa-solid fa-download"></i>
				Download
			</button>
			<button class="button" onclick={close}>Close</button>
		</div>
	{/snippet}
</CustomModal>

<style>
	.format-selector {
		display: flex;
		gap: var(--spacing-sm);
		margin-bottom: var(--spacing-md);
	}

	.format-btn {
		flex: 1;
		padding: var(--spacing-md);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-base);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
		font-weight: 500;
	}

	.format-btn:hover {
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.format-btn.active {
		background: var(--accent);
		color: white;
		border-color: var(--accent);
		box-shadow: var(--shadow-md);
	}

	.preview-container {
		background: var(--surface-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: var(--spacing-md);
		max-height: 40vh;
		overflow: auto;
	}

	.preview {
		margin: 0;
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 0.8rem;
		white-space: pre-wrap;
		word-break: break-all;
		color: var(--text-primary);
		line-height: 1.5;
	}

	.button.secondary {
		background: var(--surface-elevated);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--spacing-sm);
	}
</style>
