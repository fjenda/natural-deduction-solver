export interface Compound {
    functor: string;
    args: Compound[];
}

export function compoundToString(compound: Compound): string {
    if (compound.args.length === 0) {
        return compound.functor;
    }

    return `${compound.functor}(${compound.args.map(compoundToString).join(", ")})`;
}