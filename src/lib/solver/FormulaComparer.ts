export class FormulaComparer {
    public static compareFormulas(f1: string, f2: string): boolean {
        // if they are the same, return true
        if (f1 === f2) {
            return true;
        }

        // if they are the same, but one has outer parentheses, return true
        // this is to handle the case when the user adds parentheses to the formula
        if (f1 === `(${f2})` || f2 === `(${f1})`) {
            return true;
        }

        // if they are different, return false
        return false;
    }
}