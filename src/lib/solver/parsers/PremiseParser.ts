import {PrattParser} from "../../parsers/PrattParser";

export class PremiseParser {
    static parsePremise(premise: string | null) {
        if (premise === null || premise === '') {
            return false;
        }

        // remove all whitespaces
        premise = premise.replace(/\s/g, '');

        // syntax check
        let pratt = new PrattParser();
        let res = pratt.parse(premise);

        if (!res) return false;
        res.print();


        return res;
        // TODO: check if all variables are declared
        //       get tokens from premise
        //       initialize variable table
        //       come up with a smart way to represent the tokens so its easy to apply the deduction rules
    }
}

