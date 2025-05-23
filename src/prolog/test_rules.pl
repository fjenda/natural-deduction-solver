:- consult('substitute.pl').

% Rule format: rule(Name, PremiseCount, ApplyPredicate)
rule('IC', 2, and_intro).
rule('EC', 1, and_elim).
rule('ID', 2, or_intro).
rule('ED', 2, or_elim).
rule('II', 2, imp_intro).
rule('MP', 2, imp_elim).
rule('IE', 2, eq_intro).
rule('EE', 1, eq_elim).
rule('NI', 1, is_negation).

% Predicate logic
rule('EU', 1, forall_elim).   % Universal Elimination
rule('IU', 1, forall_intro).  % Universal Introduction
rule('IEX', 2, exists_intro).  % Existential Introduction
rule('EEX', 1, exists_elim).   % Existential Elimination

is_var(var(_)).

% Custom term_variables replacement
collect_vars(Term, Vars) :-
    collect_vars(Term, [], Vars).

collect_vars(Term, Acc, Vars) :-
    (is_var(Term) ->
        (memberchk(Term, Acc) -> Vars = Acc ; Vars = [Term|Acc])
    ;
    compound(Term) ->
        Term =.. [_|Args],
        foldl(collect_vars, Args, Acc, Vars)
    ;
    Vars = Acc).

forall_elim([forall(Var, Formula), Term], Result) :-
    substitute_free(Var, Term, Formula, Result).

forall_intro([Formula], forall(Var, Formula)) :-
    collect_vars(Formula, Vars),
    \+ member(Var, Vars).  % Var must not be free in Formula

exists_elim([exists(Var, Formula), Term], Result) :-
    substitute_free(Var, Term, Formula, Result).

exists_intro([Term, Formula, Var], exists(Var, Result)) :-
    substitute(Formula, [Term], [Var], Result).

% Helper predicates
occurs_free(Var, Term) :-
    term_variables(Term, Vars),
    memberchk(Var, Vars).

substitute_free(OldVar, NewTerm, Formula, Result) :-
    (Formula == OldVar -> Result = NewTerm)
    ;
    (is_var(Formula) -> Result = Formula)
    ;
    compound(Formula) ->
        Formula =.. [Functor|Args],
        maplist(substitute_free(OldVar, NewTerm), Args, NewArgs),
        Result =.. [Functor|NewArgs]
    ;
    Result = Formula.

% Actual rule logic

% Conjunction
and_intro([A, B], and(A, B)).
and_elim([and(A, _)], A).
and_elim([and(_, B)], B).

% Disjunction
or_intro([A, B], or(A, B)).
or_elim([or(A, B), not(A)], B).
or_elim([or(A, B), not(B)], A).

% Implication
imp_intro([A, B], imp(A, B)).
imp_elim([imp(A, B), A], B).
imp_elim([A, imp(A, B)], B).

% Equivalence
eq_intro([imp(A, B), imp(B, A)], eq(A, B)).
eq_elim([eq(A, B)], imp(A, B)).
eq_elim([eq(A, B)], imp(B, A)).

% Check if a formula is a negation of another
is_negation([not(A)], A).
is_negation([A], not(A)).

% Generic rule checker
prove_handler(Premises, Conclusion, RuleName, Parameters) :-
    rule(RuleName, PremiseCount, Predicate),
    length(Premises, PremiseCount),
    append(Premises, Parameters, AllArgs),
    call(Predicate, AllArgs, Conclusion).

find_conflict([A | Rest], A, not(A)) :- member(not(A), Rest), !.
find_conflict([not(A) | Rest], not(A), A) :- member(A, Rest), !.
find_conflict([_ | Rest], X, Y) :- find_conflict(Rest, X, Y).

has_conflict_with_rows(Proof, Conflict1, Conflict2) :-
    find_conflict(Proof, Conflict1, Conflict2).

conflict_handler(Proof, Conflict1, Conflict2, Result) :-
    (   has_conflict_with_rows(Proof, Conflict1, Conflict2)
    ->  Result = true
    ;   Conflict1 = none,
        Conflict2 = none,
        Result = false
    ).