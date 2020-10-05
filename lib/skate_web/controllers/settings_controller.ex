defmodule SkateWeb.SettingsController do
  use SkateWeb, :controller
  alias Skate.Settings
  alias Skate.Settings.VehicleLabel
  alias SkateWeb.AuthManager

  def update(conn, %{"field" => field, "value" => value} = _params) do
    username = AuthManager.Plug.current_resource(conn)
    field = field(field)
    value = value(field, value)

    case {field, value} do
      {field, {:ok, value}} when not is_nil(field) ->
        Settings.set(username, field, value)
        send_resp(conn, 200, "")

      _ ->
        send_resp(conn, 400, "")
    end
  end

  @spec field(String.t()) :: atom() | nil
  defp field("ladder_page_vehicle_label"), do: :ladder_page_vehicle_label
  defp field("shuttle_page_vehicle_label"), do: :shuttle_page_vehicle_label
  defp field(_), do: nil

  @spec value(atom() | nil, String.t()) :: {:ok, any()} | :error
  defp value(field, value)
  defp value(:ladder_page_vehicle_label, value), do: VehicleLabel.load(value)
  defp value(:shuttle_page_vehicle_label, value), do: VehicleLabel.load(value)
  defp value(_, _), do: :error
end
