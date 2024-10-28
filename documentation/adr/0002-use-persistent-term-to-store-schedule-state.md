# 2. Use :persistent_term to store schedule state

Date: 2022-01-26

## Status

Accepted

## Context

Asana: https://app.asana.com/0/116562505129567/1201514090100824

The `Schedule.Fetcher` GenServer makes a call to the `Schedule GenServer` (which a
lot of Skate calls) when it has new state to provide. Usually this works
smoothly, but sometimes it causes us to log `GenServer Schedule.Fetcher
terminating` followed by a longer message `** (stop) exited in:
GenServer.call(Schedule, [...state])`. This is then followed by some logging on
the `Schedule` side, with a bunch of warnings like `module=Elixir.Schedule
function=trip error=timeout` in the couple of minutes after the other error.

It is not purely a deadlock, but it causes a degradation of performance.

## Decision

Instead of storing the state in the `Schedule` GenServer, we will use the
[:persistent_term](https://www.erlang.org/doc/man/persistent_term.html) module
to store the data without additional copying. See
https://github.com/mbta/skate/pull/1379 for the original PR.

We investigated using Mnesia in https://github.com/mbta/skate/pull/1368, but
this had additional performance issues as well as being a much larger refactor.

## Consequences

- Updates to the state in `:persistent_term` can take several seconds
- Additional memory needs to be given to the literal allocator, which
  `:persistent_term` uses to store data
