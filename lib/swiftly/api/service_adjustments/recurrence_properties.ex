defmodule Swiftly.API.ServiceAdjustments.RecurrenceProperties do
  @moduledoc """
  Provides struct and type for a RecurrenceProperties
  """

  @type t :: %__MODULE__{
          firstOccurrenceEndTime: DateTime.t(),
          firstOccurrenceStartTime: DateTime.t(),
          recurrenceRule: String.t()
        }

  defstruct [:firstOccurrenceEndTime, :firstOccurrenceStartTime, :recurrenceRule]
end
