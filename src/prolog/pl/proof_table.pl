% proof_row(LineNumber, Term, RuleUsed, LineNumbersUsed, Replacements).
:- dynamic proof_row/5.

proof_table_get_all_rows(Rows) :-
    findall([Line, Term, Rule, LinesUsed, Replacements], proof_row(Line, Term, Rule, LinesUsed, Replacements), Rows).

proof_table_add(Term, RuleUsed, LineNumbersUsed) :-
    proof_table_add(Term, RuleUsed, LineNumbersUsed, []).

proof_table_add(Term, RuleUsed, LineNumbersUsed, Replacements) :-
    findall(L, proof_row(L, _, _, _, _), ExistingLines),
    (ExistingLines = [] -> LineNumber = 1 ; max_list(ExistingLines, MaxLine), LineNumber is MaxLine + 1),
    assertz(proof_row(LineNumber, Term, RuleUsed, LineNumbersUsed, Replacements)).

proof_table_remove(LineNumber) :-
    retract(proof_row(LineNumber, _, _, _, _)).

proof_table_edit(LineNumber, NewTerm, NewRuleUsed, NewLineNumbersUsed, NewReplacements) :-
    retractall(proof_row(LineNumber, _, _, _, _)),
    assertz(proof_row(LineNumber, NewTerm, NewRuleUsed, NewLineNumbersUsed, NewReplacements)),
    proof_table_print.

proof_table_get(LineNumber, Term) :-
    proof_row(LineNumber, Term, _, _, _).

proof_table_clear :-
    retractall(proof_row(_, _, _, _, _)).

% Print the proof table in a formatted way
proof_table_print :-
    proof_table_get_all_rows(Rows),
    format("\n~`=t Proof Table ~100|~n"),
    format("~w~t~6|~w~t~80|~w~t~10|~w~t~15|~w~n", ["Line", "Term", "Rule Used", "Lines Used", "Replacements"]),
    format("~`=t~100|~n"),
    proof_table_print_rows(Rows),
    format("~`=t~100|~n").

proof_table_print_rows([]).
proof_table_print_rows([[Line, Term, Rule, LinesUsed, Replacements]|Rest]) :-
    format("~d~t~6|~w~t~80|~w~t~10|~w~t~15|~w~n", [Line, Term, Rule, LinesUsed, Replacements]),
    proof_table_print_rows(Rest).

proof_table_can_delete_row(LineNumber) :-
    % Check if any other row uses this line number as a parent
    \+ (proof_row(_, _, _, Parents, _), member(LineNumber, Parents)).

% Succeeds if all existential eliminations have a corresponding introduction
proof_table_existential_elimination_valid :-
    findall(Line-Repl, proof_row(Line, _, 'EEX', _, Repl), EliminatedLines),
    findall(Line-Repl, proof_row(Line, _, 'IEX', _, Repl), IntroducedLines),
    existential_elimination_valid(EliminatedLines, IntroducedLines).

% Base case: no eliminations left
existential_elimination_valid([], _).

% Recursive case
existential_elimination_valid([_Line-[Var, Repl] | Rest], IntroducedLines) :-
    % Check if there is a matching introduction
    ( member(_Line2-[Repl, Var], IntroducedLines) ->
        existential_elimination_valid(Rest, IntroducedLines)
    ).

% Case when there was no replacement (should not happen, but safe)
existential_elimination_valid([_Line-[] | Rest], IntroducedLines) :-
    existential_elimination_valid(Rest, IntroducedLines).