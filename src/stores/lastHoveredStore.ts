import { writable } from 'svelte/store';

export const lastHovered = writable<{
	rule: string;
	selected: number[];
	rows: number[];
}>({ rule: '', selected: [], rows: [] });
