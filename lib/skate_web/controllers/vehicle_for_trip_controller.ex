defmodule SkateWeb.VehicleForTripController do
  use SkateWeb, :controller

  alias Realtime.{Ghost, Server, Vehicle}

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
        case vehicle_or_ghost do
          %Vehicle{} -> %{dataType: "vehicle", vehicle: vehicle_or_ghost, route: route}
          %Ghost{} -> %{dataType: "ghost", ghost: vehicle_or_ghost, route: route}
        end
    }

    json(conn, payload)
  end
end
