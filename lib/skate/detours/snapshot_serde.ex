defmodule Skate.Detours.SnapshotSerde do
  @moduledoc """
  Deserializes XState JSON Snapshots to Ecto Database Changesets
  Serializes Ecto Database Structs into XState JSON Snapshots
  """

  alias Skate.Detours.Db.Detour
  require Logger

  @doc """
  Converts a XState JSON Snapshot to Detours Database Changeset
  """
  def deserialize(user_id, %{} = snapshot) do
    {activated_at, snapshot} =
      snapshot
      |> put_in(["value", "SaveState"], "Saved")
      |> pop_in(["context", "activatedAt"])

    id = id_from_snapshot(snapshot)

    detour = (id && Skate.Detours.Detours.get_detour(id)) || %Detour{id: id, author_id: user_id}

    Skate.Detours.Db.Detour.changeset(
      detour,
      %{
        # Save Snapshot to DB until we've fully transitioned to serializing
        # snapshots from DB data
        state: snapshot,
        activated_at: activated_at
      }
    )
  end

  @doc """
  Extracts the Detour ID from a XState Snapshot
  """
  def id_from_snapshot(%{"context" => %{"uuid" => id}}), do: id
  def id_from_snapshot(%{"context" => %{}}), do: nil

  @doc """
  Builds XState Snapshot from Detours Database object
  """
  def serialize(%Detour{} = detour) do
    %{
      "value" => state_from_detour(detour),
      "status" => "active",
      "context" => context_from_detour(detour),
      "children" => snapshot_children_from_detour(detour)
    }
  end

  defp context_from_detour(%Detour{} = detour) do
    :maps.filter(fn _, v -> v != nil end, %{
      "uuid" => uuid_from_detour(detour),
      "route" => route_from_detour(detour),
      "routePattern" => routepattern_from_detour(detour),
      "startPoint" => startpoint_from_detour(detour),
      "endPoint" => endpoint_from_detour(detour),
      "waypoints" => waypoints_from_detour(detour),
      "nearestIntersection" => nearestintersection_from_detour(detour),
      "detourShape" => detourshape_from_detour(detour),
      "finishedDetour" => finisheddetour_from_detour(detour),
      "editedDirections" => editeddirections_from_detour(detour),
      "selectedDuration" => selectedduration_from_detour(detour),
      "selectedReason" => selectedreason_from_detour(detour),
      "activatedAt" => activated_at_from_detour(detour),
      "undoStack" => undostack_from_detour(detour),
      "isTextOnly" => istextonly_from_detour(detour),
      "typedDetour" => typeddetour_from_detour(detour)
    })
  end

  defp state_from_detour(%Detour{state_value: state}) when not is_nil(state), do: state

  defp state_from_detour(_), do: nil

  defp uuid_from_detour(%Detour{id: id}), do: id

  defp route_from_detour(%Detour{
         route_id: route_id,
         route_name: route_name,
         garages: garages,
         direction_names: direction_names
       })
       when not is_nil(route_id) and not is_nil(route_name) and not is_nil(garages) and
              not is_nil(direction_names) do
    %{
      "id" => route_id,
      "name" => route_name,
      "garages" => garages,
      "directionNames" => direction_names
    }
  end

  defp routepattern_from_detour(%Detour{route_pattern: route_pattern})
       when not is_nil(route_pattern) do
    route_pattern
  end

  defp routepattern_from_detour(_), do: nil

  defp startpoint_from_detour(%Detour{start_point: start_point}) when not is_nil(start_point),
    do: start_point

  defp startpoint_from_detour(_), do: nil

  defp endpoint_from_detour(%Detour{end_point: end_point}) when not is_nil(end_point),
    do: end_point

  defp endpoint_from_detour(_), do: nil

  defp waypoints_from_detour(%Detour{waypoints: waypoints}) when not is_nil(waypoints),
    do: waypoints

  defp waypoints_from_detour(_), do: nil

  defp nearestintersection_from_detour(%Detour{nearest_intersection: nearest_intersection}),
    do: nearest_intersection

  defp detourshape_from_detour(%Detour{detour_shape: detour_shape}) when not is_nil(detour_shape),
    do: detour_shape

  defp detourshape_from_detour(_), do: nil

  defp finisheddetour_from_detour(%Detour{
         detour_shape: %{"ok" => detour_shape},
         connection_points: connection_points,
         missed_stops: missed_stops,
         route_segments: route_segments
       })
       when not is_nil(detour_shape) and not is_nil(connection_points) and
              not is_nil(missed_stops) and
              not is_nil(route_segments) do
    %{
      "detourShape" => detour_shape,
      "connectionPoint" => connection_points,
      "missedStops" => missed_stops,
      "routeSegments" => route_segments
    }
  end

  defp finisheddetour_from_detour(_), do: nil

  defp editeddirections_from_detour(%Detour{edited_directions: edited_directions})
       when not is_nil(edited_directions),
       do: edited_directions

  defp editeddirections_from_detour(_), do: nil

  defp undostack_from_detour(%Detour{undo_stack: undo_stack}) when not is_nil(undo_stack),
    do: undo_stack

  defp undostack_from_detour(_), do: nil

  defp istextonly_from_detour(%Detour{is_text_only: is_text_only}) when not is_nil(is_text_only),
    do: is_text_only

  defp istextonly_from_detour(_), do: nil

  defp typeddetour_from_detour(%Detour{typed_detour: typed_detour}) when not is_nil(typed_detour),
    do: typed_detour

  defp typeddetour_from_detour(_), do: nil

  defp selectedduration_from_detour(%Detour{estimated_duration: estimated_duration})
       when not is_nil(estimated_duration),
       do: estimated_duration

  defp selectedduration_from_detour(%Detour{
         status: :active,
         estimated_duration: estimated_duration,
         id: id
       })
       when is_nil(estimated_duration) do
    Logger.warning(
      "selectedDuration is nil in active detour #{id}, defaulting to 'Until further notice'"
    )

    "Until further notice"
  end

  defp selectedduration_from_detour(_), do: nil

  defp selectedreason_from_detour(%Detour{reason: reason}) when not is_nil(reason), do: reason

  defp selectedreason_from_detour(_), do: nil

  defp activated_at_from_detour(%Detour{activated_at: %DateTime{} = activated_at}) do
    activated_at
    # For the time being, the frontend is responsible for generating the
    # `activated_at` snapshot. Because browsers are limited to millisecond
    # resolution and Ecto doesn't preserve the `milliseconds` field of a
    # `DateTime`, we need to truncate the date if we want it to match what's in
    # the stored snapshot.
    #
    # Once we're not trying to be equivalent with the stored snapshot, we could
    # probably remove this.
    #
    # See `Skate.DetourFactory.browser_date/1` and `Skate.DetourFactory.db_date`
    # for more context.
    |> DateTime.truncate(:millisecond)
    |> DateTime.to_iso8601()
  end

  defp activated_at_from_detour(%Detour{activated_at: nil}), do: nil

  defp snapshot_children_from_detour(%Detour{snapshot_children: snapshot_children})
       when not is_nil(snapshot_children),
       do: snapshot_children

  defp snapshot_children_from_detour(_), do: nil
end
