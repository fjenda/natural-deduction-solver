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
args_table_get(FunctorTerm, Arity, Matches) :-
    findall([FunctorTerm, Arity, Args],
        args_row(FunctorTerm, Arity, Args),
        Matches).

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

% Recursive term traversal
% Extract arguments from a term and add them to the args_row table
args_table_extract_from_term_and_add(Term) :-
    (   Term =.. [predicate, PredTerm],
        PredTerm =.. [Name | Args],
        length(Args, N),
        args_table_add(predicate(Name), N, Args)
    ;   Term =.. [function, FuncTerm],
        FuncTerm =.. [Name | Args],
        length(Args, N),
        args_table_add(function(Name), N, Args)
    ;   Term =.. [_Functor | Args],
        maplist(args_table_extract_from_term_and_add, Args)
    ;   true
    ).

args_table_extract_from_term_and_remove(Term) :-
    (   Term =.. [predicate, PredTerm],
        PredTerm =.. [Name | Args],
        length(Args, N),
        args_table_remove(predicate(Name), N, Args)
    ;   Term =.. [function, FuncTerm],
        FuncTerm =.. [Name | Args],
        length(Args, N),
        args_table_remove(function(Name), N, Args)
    ;   Term =.. [_Functor | Args],
        maplist(args_table_extract_from_term_and_remove, Args)
    ;   true
    ).