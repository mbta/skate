defmodule Report.UserSettings do
  @moduledoc """
  Report returning the contents of the user_settings table to get a
  sense of how many people have different configurations of Skate set
  up. Omits actual username.
  """

  import Ecto.Query
  alias Skate.Settings.Db.UserSettings, as: DbUserSettings

  @behaviour Report

  @impl Report
  def run() do
    {:ok,
     Skate.Repo.all(
       from(s in DbUserSettings,
         select: %{
           "ladder_page_vehicle_label" => s.ladder_page_vehicle_label,
           "shuttle_page_vehicle_label" => s.shuttle_page_vehicle_label,
           "vehicle_adherence_colors" => s.vehicle_adherence_colors
         }
       )
     )}
  end

  @impl Report
  def short_name(), do: "user_settings"

  @impl Report
  def description(), do: "User settings"
end
