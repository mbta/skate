defmodule Concentrate.Pipeline do
  @moduledoc """
  Behavior for defining a concentrate pipeline. Generally these included sources and consumers, and sometimes also a merge step.
  """

  @callback init(keyword()) :: [Supervisor.child_spec()]
end
