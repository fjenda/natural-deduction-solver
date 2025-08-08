/**
 * Result interfaces for typechecking
 */
export interface ProveResult {
  X: unknown;
}

export interface SubstitutionResult {
  X: unknown;
}

export interface ContradictionResult {
  X: unknown;
  Y: unknown;
  Z: unknown;
}

export interface ProofTableResult {
  X: unknown;
}

export interface ArgsTableResult {
  X: ArgsTableRow[];
}

export type ArgsTableRow = {
  0: PrologCompound;
  1: number;
  2: PrologCompound[];
};

export type PrologCompound = {
  $t: "t";
  functor: string;
  [key: string]: any;
};
