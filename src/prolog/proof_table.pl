% proof_row(LineNumber, Term, RuleUsed, LineNumbersUsed, Replacements).
:- dynamic proof_row/5.

add_proof(Term, RuleUsed, LineNumbersUsed) :-
    add_proof(Term, RuleUsed, LineNumbersUsed, []).

add_proof(Term, RuleUsed, LineNumbersUsed, Replacements) :-
    findall(L, proof_row(L, _, _, _, _), ExistingLines),
    (ExistingLines = [] -> LineNumber = 1 ; max_list(ExistingLines, MaxLine), LineNumber is MaxLine + 1),
    assertz(proof_row(LineNumber, Term, RuleUsed, LineNumbersUsed, Replacements)),
    print_proof_table.

remove_proof(LineNumber) :-
    retract(proof_row(LineNumber, _, _, _, _)),
    print_proof_table.

clear_proof_table :-
    retractall(proof_row(_, _, _, _, _)).

% Print the proof table in a formatted way
print_proof_table :-
    findall([Line, Term, Rule, LinesUsed, Replacements], proof_row(Line, Term, Rule, LinesUsed, Replacements), Rows),
    format("\n~`=t Proof Table ~100|~n"),
    format("~w~t~6|~w~t~50|~w~t~10|~w~t~15|~w~n", ["Line", "Term", "Rule Used", "Lines Used", "Replacements"]),
    format("~`=t~100|~n"),
    print_proof_rows(Rows),
    format("~`=t~100|~n").

print_proof_rows([]).
print_proof_rows([[Line, Term, Rule, LinesUsed, Replacements]|Rest]) :-
    format("~d~t~6|~w~t~50|~w~t~10|~w~t~15|~w~n", [Line, Term, Rule, LinesUsed, Replacements]),
    print_proof_rows(Rest).