defmodule Skate.Detours.ShapeSegment do
  @moduledoc """
  Represents the shape points which form a segment associated
  with stops on the shape.
  """

  @type t :: %__MODULE__{
          points: [Util.Location.From.t()],
          stops: [Util.Location.From.t()]
        }

  defstruct stops: [], points: []
end
