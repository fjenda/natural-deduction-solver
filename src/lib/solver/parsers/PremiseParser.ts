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
    }
}

