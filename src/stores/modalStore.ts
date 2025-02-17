import { writable } from "svelte/store";
import type { ButtonContent } from "../types/ButtonContent";
import type {NDRule} from "../lib/rules/DeductionRule";
import type {IRule} from "../lib/rules/IRule";

export const showModal = writable<boolean>(false);
export const modalHeader = writable<string>("");
export const modalContent = writable<string>("");
export const modalButtons = writable<ButtonContent[]>([
    {
        text: "Confirm",
        action: () => {
            showModal.set(false);
        }
    },
    {
        text: "Cancel",
        action: () => {
            showModal.set(false);
        }
    }
]);
export const modalInput = writable<HTMLInputElement | null>(null);

export const lastHovered =
    writable<{ rule: string, selected: number[], rows: number[] }>({ rule: "", selected: [], rows: [] });