<script lang="ts">
import type { ParseDiagnostic } from '../../../types/ParseDiagnostic';
interface ParseDiagnosticHintProps {
diagnostic?: ParseDiagnostic;
}
let { diagnostic }: ParseDiagnosticHintProps = $props();
const source = $derived(diagnostic?.source ?? '');
const clampedStart = $derived(Math.max(0, Math.min(diagnostic?.start ?? 0, source.length)));
const clampedEnd = $derived(
Math.max(clampedStart, Math.min(diagnostic?.end ?? clampedStart, source.length))
);
const prefix = $derived(source.slice(0, clampedStart));
const highlighted = $derived(source.slice(clampedStart, clampedEnd));
const suffix = $derived(source.slice(clampedEnd));
const eofMarker = $derived(Boolean(diagnostic) && clampedStart >= source.length);
const expectedLabel = $derived(diagnostic?.expected?.filter(Boolean).join(', ') ?? '');
</script>
{#if diagnostic}
<div class="diagnostic-panel" class:warning={diagnostic.severity === 'warning'}>
<div class="header">
<div class="badge">{diagnostic.severity === 'warning' ? 'Incomplete syntax' : 'Syntax error'}</div>
<div class="message">{diagnostic.message}</div>
</div>
<div class="preview" aria-live="polite">
<span class="code">{prefix}</span>
{#if eofMarker}
<span class="highlight marker">?</span>
{:else}
<span class="highlight">{highlighted || ' '}</span>
{/if}
<span class="code">{suffix}</span>
</div>
<div class="meta">
{#if diagnostic.found}
<span><strong>Found:</strong> <code>{diagnostic.found}</code></span>
{/if}
{#if expectedLabel}
<span><strong>Expected:</strong> {expectedLabel}</span>
{/if}
</div>
</div>
{/if}
<style>
.diagnostic-panel {
display: flex;
flex-direction: column;
gap: var(--spacing-sm);
padding: var(--spacing-md);
border-radius: var(--radius-lg);
border: 1px solid var(--error);
background: linear-gradient(180deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.03));
box-shadow: var(--shadow-sm);
}
.diagnostic-panel.warning {
border-color: var(--warning);
background: linear-gradient(180deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04));
}
.header {
display: flex;
flex-wrap: wrap;
align-items: center;
gap: var(--spacing-sm);
}
.badge {
padding: 0.25rem 0.65rem;
border-radius: 999px;
font-size: 0.75rem;
font-weight: 700;
letter-spacing: 0.01em;
background: rgba(255, 255, 255, 0.7);
color: var(--error);
}
.warning .badge {
color: var(--warning);
}
.message {
font-size: 0.9rem;
font-weight: 600;
color: var(--text-primary);
}
.preview {
padding: var(--spacing-md);
border-radius: var(--radius-md);
background: rgba(15, 23, 42, 0.04);
font-family: monospace;
font-size: 0.95rem;
line-height: 1.6;
word-break: break-word;
}
.code {
white-space: pre-wrap;
}
.highlight {
white-space: pre-wrap;
background: rgba(239, 68, 68, 0.18);
color: var(--error);
border-bottom: 2px solid var(--error);
border-radius: 0.2rem;
padding: 0.05rem 0.1rem;
}
.warning .highlight {
background: rgba(245, 158, 11, 0.18);
color: var(--warning);
border-bottom-color: var(--warning);
}
.marker {
font-weight: 700;
}
.meta {
display: flex;
flex-wrap: wrap;
gap: var(--spacing-md);
font-size: 0.82rem;
color: var(--text-secondary);
}
.meta code {
font-family: monospace;
}
</style>
