% free_in(Var, Term) with debug
free_in(Var, Term) :-
    free_in(Term, Var, []).

% Base case: Term is exactly the variable we are looking for
free_in(Var, Var, BoundVars) :-
    \+ member(Var, BoundVars).

% Ignore bound variables
free_in(Var, Var, BoundVars) :-
    member(Var, BoundVars),
    fail.

% Recursive case: compound term
free_in(Term, Var, BoundVars) :-
    compound(Term),
    Term =.. [Functor | Args],
    ( (Functor = forall ; Functor = exists),
      Args = [BoundVar, Body] ->
        free_in(Body, Var, [BoundVar | BoundVars])
    ;
        member(Arg, Args),
        free_in(Arg, Var, BoundVars)
    ).