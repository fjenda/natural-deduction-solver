% Substitute function for theorems
substitute(forall(Binder, Body), Vars, NewVars, forall(NewBinder, NewBody)) :-
    substitute(Body, Vars, NewVars, NewBody),
    substitute(Binder, Vars, NewVars, NewBinder).

substitute(exists(Binder, Body), Vars, NewVars, exists(NewBinder, NewBody)) :-
    substitute(Body, Vars, NewVars, NewBody),
    substitute(Binder, Vars, NewVars, NewBinder).

% Base case: Replace a variable if it appears in Vars.
substitute(Var, Vars, NewVars, NewVar) :-
%    atom(Var), % Symbolic variable
    nth0(Index, Vars, Var), % Find index of Var in Vars
    nth0(Index, NewVars, NewVar), !. % Replace with corresponding NewVar

% Recursive case
substitute(Formula, Vars, NewVars, Result) :-
    compound(Formula),
    Formula =.. [Functor | Args],
    substitute_list(Args, Vars, NewVars, NewArgs),
    Result =.. [Functor | NewArgs].

% If the formula is not a variable or compound term, return it as is.
substitute(Formula, _, _, Formula) :- atomic(Formula).

% Base case for lists.
substitute_list([], _, _, []).

% Recursive case for lists.
substitute_list([Head | Tail], Vars, NewVars, [NewHead | NewTail]) :-
    substitute(Head, Vars, NewVars, NewHead),
    substitute_list(Tail, Vars, NewVars, NewTail).

% Substitute free for replacing a variable in quantified expressions
% =========================================================
% substitute_free(+OldVar, +NewTerm, +Formula, -Result)
% Entry point: Starts with an empty bound list
% =========================================================
substitute_free(OldVar, NewTerm, Formula, Result) :-
    substitute_recursive(Formula, OldVar, NewTerm, [], Result).

% 1. BASE CASE: Variable matches OldVar and is NOT bound (Free)
% We replace it!
substitute_recursive(OldVar, OldVar, NewTerm, Bound, NewTerm) :-
    \+ member(OldVar, Bound), !.

% 2. BASE CASE: Variable matches OldVar but IS bound (Shadowed)
% We do NOT replace it.
substitute_recursive(OldVar, OldVar, _, Bound, OldVar) :-
    member(OldVar, Bound), !.

% 3. BASE CASE: Recursion over Quantifiers (forall/exists)
% We add the quantifier's variable to the Bound list (Scope)
substitute_recursive(Formula, OldVar, NewTerm, Bound, Result) :-
    compound(Formula),
    Formula =.. [Quantifier, Binder, Body],
    (Quantifier = forall ; Quantifier = exists),
    !,
    % Recurse with Binder added to Bound list
    substitute_recursive(Body, OldVar, NewTerm, [Binder|Bound], NewBody),
    Result =.. [Quantifier, Binder, NewBody].

% 4. RECURSIVE CASE: Standard predicates (and, or, imp, predicates)
substitute_recursive(Formula, OldVar, NewTerm, Bound, Result) :-
    compound(Formula),
    Formula =.. [Functor|Args],
    !,
    map_substitute(Args, OldVar, NewTerm, Bound, NewArgs),
    Result =.. [Functor|NewArgs].

% 5. BASE CASE: Atomic terms or non-matching variables
% (const(a), var(z), etc.) - Return as is
substitute_recursive(Term, _, _, _, Term).

% --- Helper for Lists ---
map_substitute([], _, _, _, []).
map_substitute([H|T], OldVar, NewTerm, Bound, [HRes|TRes]) :-
    substitute_recursive(H, OldVar, NewTerm, Bound, HRes),
    map_substitute(T, OldVar, NewTerm, Bound, TRes).
