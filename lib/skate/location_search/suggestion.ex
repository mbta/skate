defmodule Skate.LocationSearch.Suggestion do
  @type t :: %__MODULE__{
          text: String.t(),
          place_id: String.t() | nil
        }

  @enforce_keys [:text, :place_id]

  @derive {Jason.Encoder, only: [:text, :place_id]}

  defstruct [
    :text,
    :place_id
  ]
end
