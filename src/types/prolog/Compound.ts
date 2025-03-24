/**
 * Represents a compound term in Prolog.
 */
export interface Compound {
    functor: string;
    args: Compound[];
}

/**
 * Converts the compound term to a readable format.
 * @param compound - the compound to convert
 */
export function compoundToString(compound: Compound): string {
    if (compound.args.length === 0) {
        return compound.functor === compound.functor.toUpperCase() ? `'${compound.functor}'` : compound.functor;
    }

    return `${compound.functor}(${compound.args.map(compoundToString).join(", ")})`;
}