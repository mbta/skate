defmodule Schedule.Minischedule.Break do
  alias Schedule.Hastus.Activity
  alias Schedule.Hastus.Place

  @type break_type :: String.t()

  @type t :: %__MODULE__{
          break_type: break_type(),
          start_time: String.t(),
          end_time: String.t(),
          start_place: Place.id(),
          end_place: Place.id()
        }

  @enforce_keys [
    :break_type,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  defstruct [
    :break_type,
    :start_time,
    :end_time,
    :start_place,
    :end_place
  ]

  @spec from_activity(Activity.t()) :: t()
  def from_activity(activity) do
    %__MODULE__{
      break_type: activity.activity_type,
      start_time: activity.start_time,
      end_time: activity.end_time,
      start_place: activity.start_place,
      end_place: activity.end_place
    }
  end

end
