export class Rule {
    // S -> E+T
    lhs: string; // S
    rhs: string[]; // [E, +, T]

    constructor(lhs: string, rhs: string[]) {
        this.lhs = lhs;
        this.rhs = rhs;
    }
}

class EarleyItem {
    // S -> . E+T (0)
    rule: Rule; // S -> E+T
    dot: number; // .
    start: number; // (0)

    constructor(rule: Rule, dot: number, start: number) {
        this.rule = rule;
        this.dot = dot;
        this.start = start;
    }

    isComplete() {
        return this.dot === this.rule.rhs.length;
    }

    equals(item: EarleyItem) {
        return this.rule.lhs === item.rule.lhs && 
               this.rule.rhs.join('') === item.rule.rhs.join('') &&
               this.dot === item.dot &&
               this.start === item.start;
    }

    toString() {
        return `${this.rule.lhs} -> ${this.rule.rhs.slice(0, this.dot).join(' ')} . ${this.rule.rhs.slice(this.dot).join(' ')} (${this.start})`;
    }
}

class State {
    items: EarleyItem[] = [];

    push(item: EarleyItem) {
        this.items.push(item);
    }

    pop() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    get(index: number) {
        return this.items[index];
    }

    size() {
        return this.items.length;
    }

    toString() {
        return this.items.map(item => item.toString()).join('\n');
    }
}

export class EarleyParser {
    grammar: Rule[] = [];
    states: State[] = [];
    startingPoint: string

    public constructor(startingPoint: string, grammar: Rule[]) {
        this.grammar = grammar;
        this.states[0] = new State();

        this.startingPoint = startingPoint;
        const startingRules = this.grammar.filter(rule => rule.lhs === startingPoint);
        startingRules.forEach(rule => {
            this.states[0].push(new EarleyItem(rule, 0, 0));
        });
    }

    // setGrammar(grammar: Rule[], startingPoint: string) {
    //     this.grammar = grammar;
    //     this.states[0] = new State();
    //     this.startingPoint = startingPoint;
    //     const startingRules = this.grammar.filter(rule => rule.lhs === startingPoint);
    //     startingRules.forEach(rule => {
    //         this.states[0].push(new EarleyItem(rule, 0, 0));
    //     });
    // }

    restart() {
        this.states = [];
        this.states[0] = new State();
        const startingRules = this.grammar.filter(rule => rule.lhs === this.startingPoint);
        startingRules.forEach(rule => {
            this.states[0].push(new EarleyItem(rule, 0, 0));
        });
    }

    isNonTerminal(symbol: string) {
        return this.grammar.some(rule => rule.lhs === symbol);
    }

    parse(input: string): boolean {
        // remove whitespace characters
        input = input.replace(/\s/g, '');

        // restart the parser
        this.restart();

        // outer loop
        for (let i = 0; i < this.states.length; i++) {
            // inner loop
            for (let j = 0; j < this.states[i].size(); j++) {
                const item = this.states[i].get(j);
                const inputChar = input[i];
                if (item.isComplete()) {
                    this.complete(inputChar, this.states[i], j);
                } else {
                    const symbol = item.rule.rhs[item.dot];
                    if (this.isNonTerminal(symbol)) {
                        this.predict(symbol, this.states[i], item.start, i);
                    } else {
                        if (i < input.length) {
                            this.scan(inputChar, this.states[i], j, i);
                        }
                    }
                }
            }
        }

        // print the result
        // this.states.forEach((state, index) => {
        //     console.log(`\nState ${index}`);
        //     console.log(state.toString());
        // });

        // check if the input is valid
        const lastState = this.states[this.states.length - 1];
        return lastState.items.filter(item => item.rule.lhs === this.startingPoint &&
                                                         item.start === 0 &&
                                                         item.dot === item.rule.rhs.length).length > 0;
    }

    // predict the next non-terminal symbol
    predict(symbol: string, state: State, start: number, inputIndex: number) {
        const rules = this.grammar.filter(rule => rule.lhs === symbol);
        rules.forEach(rule => {
            state.push(new EarleyItem(rule, 0, inputIndex));
        });

        // remove duplicates or we will be stuck in an infinite loop
        state.items = state.items.filter((item, index) => {
            return state.items.findIndex(i => i.equals(item)) === index;
        });
    }

    // scan the next terminal symbol
    scan(input: string, state: State, index: number, stateIndex: number) {
        if (input === state.get(index).rule.rhs[state.get(index).dot]) {
            // we copy the item and move the dot one position to the right
            let item = new EarleyItem(state.get(index).rule, state.get(index).dot + 1, state.get(index).start);
            this.states[stateIndex + 1] = this.states[stateIndex + 1] || new State();
            this.states[stateIndex + 1].push(item);
        }
    }

    // complete the items
    complete(input: string, state: State, index: number) {
        let stateSet = this.states[state.get(index).start];
        const rules = stateSet.items.filter(item => item.rule.rhs[item.dot] === state.get(index).rule.lhs);
        
        rules.forEach(rule => {
            // shift the dot one position to the right
            let item = new EarleyItem(rule.rule, rule.dot + 1, rule.start);
            
            // push the completed item into the current state
            state.push(item);
        });
    }
}

// const grammar = [
//     new Rule('Formula', ['[' , 'Formula', ']']),
//     new Rule('Formula', ['(', 'Formula', ')']),
//     new Rule('Formula', ['Formula', 'LogicalOp', 'Formula', 'LogicalTail']),
//     new Rule('Formula', ['!', 'Formula']),
//     new Rule('Formula', ['Quantifier', 'Variable', 'Formula']),
//     new Rule('Formula', ['Predicate', '(', 'TermList', ')']),
//     new Rule('Formula', ['Variable']),
//
//     new Rule('LogicalOp', ['&']),
//     new Rule('LogicalOp', ['|']),
//     new Rule('LogicalOp', ['>']),
//     new Rule('LogicalOp', ['=']),
//
//     new Rule('LogicalTail', ['LogicalOp', 'Formula', 'LogicalTail']),
//     new Rule('LogicalTail', []),
//
//     new Rule('Quantifier', ['@']),
//     new Rule('Quantifier', ['?']),
//
//     new Rule('TermList', ['Term', 'TermListTail']),
//     new Rule('TermListTail', [',', 'Term', 'TermListTail']),
//     new Rule('TermListTail', []),
//
//     new Rule('Term', ['Variable']),
//     new Rule('Term', ['Constant']),
//     new Rule('Term', ['Function', '(', 'TermList', ')']),
//
//     new Rule('Constant', ['a']),
//     new Rule('Constant', ['b']),
//     new Rule('Constant', ['c']),
//     new Rule('Constant', ['d']),
//
//     new Rule('Variable', ['h']),
//     new Rule('Variable', ['i']),
//     new Rule('Variable', ['j']),
//     new Rule('Variable', ['k']),
//
//     new Rule('Predicate', ['Variable']),
//     new Rule('Predicate', ['Large']),
//
//     new Rule('Function', ['Variable']),
//
//     new Rule('Large', ['A']),
//     new Rule('Large', ['B']),
//     new Rule('Large', ['C']),
//     new Rule('Large', ['D']),
// ];

// const parser = new EarleyParser('Formula', grammar);
// parser.parse('?y(P(y) & R(a,y))');
// parser.parse('[A(h) & B(i)]');