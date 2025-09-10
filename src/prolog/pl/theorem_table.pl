:- consult('proof_table.pl').

% theorem_table(Theorem, Mode, Proof).
:- dynamic theorem_table/3.

theorem_table_add(Theorem, Mode) :-
    proof_table_get_all_rows(Proof),

    (   theorem_table(Theorem, Mode, ExistingProof)
    ->  (   ExistingProof == Proof
        ->  true  % The same proof already exists, do nothing
        ;   retract(theorem_table(Theorem, Mode, ExistingProof)),
            assertz(theorem_table(Theorem, Mode, Proof))
        )
    ;   assertz(theorem_table(Theorem, Mode, Proof))
    ).

theorem_table_remove(Theorem, Mode) :-
    retractall(theorem_table(Theorem, Mode, _)).

theorem_table_lookup(Theorem, Mode, Proof) :-
    theorem_table(Theorem, Mode, Proof).

theorem_table_get_all(Theorems, Mode) :-
    findall([Theorem, Mode, Proof], theorem_table(Theorem, Mode, Proof), Theorems).

theorem_table_clear :-
    retractall(theorem_table(_, _, _)).

theorem_table_print :-
    forall(theorem_table(Theorem, Mode, Proof),
           (   format('Theorem: ~w~nMode: ~w~nProof: ~w~n~n', [Theorem, Mode, Proof])
           )).