defmodule SkateWeb.VehicleForTripController do
  use SkateWeb, :controller

  alias Realtime.Server

  @spec show(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def show(conn, %{"trip_ids" => trip_ids}) do
    trip_ids = String.split(trip_ids, ",")

    vehicle_or_ghost =
      case Server.peek_at_vehicles(trip_ids) do
        [vehicle_or_ghost] -> vehicle_or_ghost
        _ -> nil
      end

    route = vehicle_or_ghost && Schedule.route_by_id(vehicle_or_ghost.route_id)

    payload = %{
      data:
        if vehicle_or_ghost do
          %{vehicleOrGhostData: vehicle_or_ghost, routeData: route}
        end
    }

    json(conn, payload)
  end
end
