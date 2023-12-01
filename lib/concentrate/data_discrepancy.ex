defmodule Concentrate.DataDiscrepancy do
  @moduledoc false

  @type t :: %__MODULE__{
          attribute: String.t(),
          sources: [source()]
        }

  @enforce_keys [:attribute]

  @type source :: %{
          id: String.t(),
          value: String.t()
        }

  @derive Jason.Encoder

  defstruct [
    :attribute,
    sources: []
  ]
end
