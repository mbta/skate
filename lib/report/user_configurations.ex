defmodule Report.UserConfigurations do
  @moduledoc """
  Report the configuration each Skate user has done, including route tabs
  & settings.
  """
  import Ecto.Query

  @behaviour Report

  @impl Report
  def run() do
    all_user_configuration =
      from(user in Skate.Settings.Db.User)
      |> Skate.Repo.all()
      |> Skate.Repo.preload([:user_settings, :route_tabs])
      |> Enum.map(&format_configuration(&1))

    {:ok, all_user_configuration}
  end

  @spec format_configuration(map()) :: map()
  defp format_configuration(user) do
    %{
      email: user.email,
      username: user.username,
      user_uuid: user.uuid,
      ladder_page_vehicle_label: user.user_settings.ladder_page_vehicle_label,
      shuttle_page_vehicle_label: user.user_settings.shuttle_page_vehicle_label,
      vehicle_adherence_colors: user.user_settings.vehicle_adherence_colors,
      routes_per_tab:
        user.route_tabs
        |> Enum.map(&Integer.to_string(length(&1.selected_route_ids)))
        |> Enum.join(",")
    }
  end

  @impl Report
  @spec short_name :: <<_::152>>
  def short_name(), do: "user_configurations"

  @impl Report
  @spec description :: <<_::208>>
  def description(), do: "User settings & route tabs"
end
