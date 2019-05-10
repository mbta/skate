defmodule Concentrate.Reporter do
  @moduledoc """
  Reporter: log statistics or other information

  This module defines an interface to output statistical data about the
  current state of Concentrate. It receives the full list of data and outputs
  a list of data.

  ## Callbacks

  * `init/0`: returns an initial state
  * `log/2`: receives the list of trip groups and the current state;
    returns a keyword list of stats and the new state
  """
  alias Concentrate.Encoder.GTFSRealtimeHelpers
  @type state :: term
  @type stats :: [{atom, term}]

  @callback init() :: state
  @callback log([GTFSRealtimeHelpers.trip_group()], state) :: {stats, state}
end
