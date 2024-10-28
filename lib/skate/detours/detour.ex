defmodule Skate.Detours.Detour do
  @moduledoc """
  Modules for different detour structures that can be read from the db
  """

  defmodule Detailed do
    @moduledoc """
    Detailed detours have had the db detour state parsed into attributes
    """
    @type t :: %__MODULE__{
            id: integer(),
            route: String.t(),
            direction: String.t(),
            name: String.t(),
            intersection: String.t(),
            updated_at: integer(),
            author_id: integer(),
            status: :active | :draft | :past
          }

    @derive Jason.Encoder

    defstruct [
      :id,
      :route,
      :direction,
      :name,
      :intersection,
      :updated_at,
      :author_id,
      :status
    ]
  end

  defmodule WithState do
    @moduledoc """
    Detours WithState have had their state left intact
    """
    @type t :: %__MODULE__{
            author: String.t(),
            state: map(),
            updated_at: integer()
          }

    @derive Jason.Encoder

    defstruct [
      :author,
      :state,
      :updated_at
    ]
  end
end
