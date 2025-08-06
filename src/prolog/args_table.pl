% args_row(PremiseOrFunction, NumArgs, Args)
:- dynamic args_row/3.

% Add a new row to the args_row table
add_row(PremiseOrFunction, NumArgs, Args) :-
    % Check if this exact row already exists
    \+ args_row(PremiseOrFunction, NumArgs, Args),
    assertz(args_row(PremiseOrFunction, NumArgs, Args)).


remove_row(PremiseOrFunction, NumArgs, Args) :-
    % Remove the row if it exists
    retract(args_row(PremiseOrFunction, NumArgs, Args)).

% Get all rows that match a specific FunctorTerm and Arity
get_matching(FunctorTerm, Arity, Matches) :-
    findall([FunctorTerm, Arity, Args],
        args_row(FunctorTerm, Arity, Args),
        Matches).

% Clear the args_row table
clear_args_table :-
    retractall(args_row(_, _, _)).

% Print the args_row table in a formatted way
print_args_table :-
    findall([F, N, A], args_row(F, N, A), Rows),
    format("~n~`=t Args Table ~60|~n"),
    format("~w~t~20|~w~t~35|~w~n", ["Function/Premise", "Arity", "Arguments"]),
    format("~`=t~60|~n"),
    print_rows(Rows),
    format("~`=t~60|~n").

% Helper predicate to print rows
print_rows([]).
print_rows([[F, N, A]|Rest]) :-
    format("~w~t~20|~d~t~35|~w~n", [F, N, A]),
    print_rows(Rest).

% Recursive term traversal
% Extract arguments from a term and add them to the args_row table
extract_and_add_args(Term) :-
    (   Term =.. [predicate, PredTerm],
        PredTerm =.. [Name | Args],
        length(Args, N),
        add_row(predicate(Name), N, Args)
    ;   Term =.. [function, FuncTerm],
        FuncTerm =.. [Name | Args],
        length(Args, N),
        add_row(function(Name), N, Args)
    ;   Term =.. [_Functor | Args],
        maplist(extract_and_add_args, Args)
    ;   true
    ),
    print_args_table  % Print the table after adding the args
    .