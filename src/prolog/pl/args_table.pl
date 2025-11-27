% args_row(PremiseOrFunction, NumArgs, Args)
:- dynamic args_row/3.

% Add a new row to the args_row table
args_table_add(PremiseOrFunction, NumArgs, Args) :-
    % Check if this exact row already exists
    \+ args_row(PremiseOrFunction, NumArgs, Args),
    assertz(args_row(PremiseOrFunction, NumArgs, Args)).

args_table_remove(PremiseOrFunction, NumArgs, Args) :-
    % Remove the row if it exists
    retract(args_row(PremiseOrFunction, NumArgs, Args)).

% Get all rows that match a specific FunctorTerm and Arity
args_table_get(PremiseOrFunction, NumArgs, _Args, Matches) :-
    findall([PremiseOrFunction, NumArgs, Args],
        args_row(PremiseOrFunction, NumArgs, Args),
        Matches).

%args_table_get(FunctorTerm, Arity, Matches) :-
%    findall([FunctorTerm, Arity, Args],
%        args_row(FunctorTerm, Arity, Args),
%        Matches).

% Clear the args_row table
args_table_clear :-
    retractall(args_row(_, _, _)).

% Print the args_row table in a formatted way
args_table_print :-
    findall([F, N, A], args_row(F, N, A), Rows),
    format("~n~`=t Args Table ~60|~n"),
    format("~w~t~20|~w~t~35|~w~n", ["Function/Premise", "Arity", "Arguments"]),
    format("~`=t~60|~n"),
    args_table_print_rows(Rows),
    format("~`=t~60|~n").

% Helper predicate to print rows
args_table_print_rows([]).
args_table_print_rows([[F, N, A]|Rest]) :-
    format("~w~t~20|~d~t~35|~w~n", [F, N, A]),
    args_table_print_rows(Rest).

% Recursive term traversal with customizable action
args_table_extract_from_term(Action, Term) :-
    (   Term =.. [predicate, PredTerm],
        PredTerm =.. [Name | Args],
        length(Args, N),
        call(Action, predicate(Name), N, Args)
    ;   Term =.. [function, FuncTerm],
        FuncTerm =.. [Name | Args],
        length(Args, N),
        call(Action, function(Name), N, Args)
    ;   Term =.. [_Functor | Args],
        maplist(args_table_extract_from_term(Action), Args)
    ;   true
    ).

args_table_extract_from_term_and_add(Term) :-
    args_table_extract_from_term(args_table_add, Term).

args_table_extract_from_term_and_remove(Term) :-
    args_table_extract_from_term(args_table_remove, Term).

% Collect the functor/arity/args directly from the term itself
triples_from_term(Term, Triples) :-
    (   Term =.. [predicate, PredTerm]
    ->  PredTerm =.. [Name | Args],
        length(Args, N),
        Triples0 = [[predicate(Name), N, Args]],
        maplist(triples_from_term, Args, SubTriplesLists),
        append([Triples0 | SubTriplesLists], TriplesAll)
    ;   Term =.. [function, FuncTerm]
    ->  FuncTerm =.. [Name | Args],
        length(Args, N),
        Triples0 = [[function(Name), N, Args]],
        maplist(triples_from_term, Args, SubTriplesLists),
        append([Triples0 | SubTriplesLists], TriplesAll)
    ;   Term =.. [_Functor | Args]
    ->  maplist(triples_from_term, Args, SubTriplesLists),
        append(SubTriplesLists, TriplesAll)
    ;   TriplesAll = []
    ),
    sort(TriplesAll, Triples).  % deduplicate

% Recursive traversal for getters (returns deduplicated matches not already in the term)
args_table_extract_from_term_and_get(Term, Matches) :-
    (   Term =.. [predicate, PredTerm]
    ->  PredTerm =.. [Name | Args],
        length(Args, N),
        args_table_get(predicate(Name), N, Args, Matches0),
        maplist(args_table_extract_from_term_and_get, Args, SubMatchesLists),
        append([Matches0 | SubMatchesLists], MatchesAll)
    ;   Term =.. [function, FuncTerm]
    ->  FuncTerm =.. [Name | Args],
        length(Args, N),
        args_table_get(function(Name), N, Args, Matches0),
        maplist(args_table_extract_from_term_and_get, Args, SubMatchesLists),
        append([Matches0 | SubMatchesLists], MatchesAll)
    ;   Term =.. [_Functor | Args]
    ->  maplist(args_table_extract_from_term_and_get, Args, SubMatchesLists),
        append(SubMatchesLists, MatchesAll)
    ;   MatchesAll = []
    ),
    sort(MatchesAll, AllMatches),

    % compute which triples are already in the term
    triples_from_term(Term, TermTriples),

    % remove them from results
    subtract(AllMatches, TermTriples, Matches).


% Proof is a list of rows
args_table_rebuild :-
    args_table_clear,
    proof_table_get_all_rows(Proof),
%    for each row in proof extract args and add to table
    maplist(args_table_extract_from_term_and_add, Proof).

is_constant(const(_)).
is_variable(var(_)).

args_table_term_exists(Term) :-
    findall(Args, args_row(_, _, Args), AllArgs),
    flatten(AllArgs, FlatArgs),
    sort(FlatArgs, UniqueArgs),
    member(Term, UniqueArgs).

args_table_constant_exists(Constant) :-
    is_constant(Constant),
    args_table_term_exists(Constant).

args_table_variable_exists(Variable) :-
    is_variable(Variable),
    args_table_term_exists(Variable).