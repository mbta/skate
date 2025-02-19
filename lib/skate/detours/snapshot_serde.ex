defmodule Skate.Detours.SnapshotSerde do
  @moduledoc """
  Deserializes XState JSON Snapshots to Ecto Database Changesets
  Serializes Ecto Database Structs into XState JSON Snapshots
  """

  require Logger

  alias Skate.Detours.Db.Detour

  @doc """
  Converts a XState JSON Snapshot to Detours Database Changeset
  """
  def deserialize(user_id, %{} = snapshot) do
    Skate.Detours.Db.Detour.changeset(
      %Skate.Detours.Db.Detour{
        # `id` is `nil` by default, so a `nil` `id` should be fine
        id: id_from_snapshot(snapshot),
        author_id: user_id
      },
      %{
        # Save Snapshot to DB until we've fully transitioned to serializing
        # snapshots from DB data
        state: snapshot,
        activated_at: activated_at_from_snapshot(snapshot)
      }
    )
  end

  defp activated_at_from_snapshot(%{"context" => %{"activatedAt" => activated_at}}),
    do: activated_at

  defp activated_at_from_snapshot(_),
    do: nil

  @doc """
  Extracts the Detour ID from a XState Snapshot
  """
  def id_from_snapshot(%{"context" => %{"uuid" => id}}), do: id
  def id_from_snapshot(%{"context" => %{}}), do: nil

  @doc """
  Builds XState Snapshot from Detours Database object
  """
  def serialize(%Detour{} = detour) do
    validate_serialized_snapshot(detour)
  end

  def compare_snapshots(%Detour{} = detour) do
    serialized_snapshot = serialize_snapshot(detour)
    compare_snapshots(detour, serialized_snapshot)
  end

  def compare_snapshots(
        %Detour{state: %{"context" => state_context} = state},
        %{"context" => serialized_context} = serialized_snapshot
      ) do
    relevant_state_keys = Map.keys(serialized_snapshot)
    relevant_context_keys = Map.keys(serialized_context)
    scoped_state_context = Map.take(state_context, relevant_context_keys)

    scoped_state =
      state
      |> Map.take(relevant_state_keys)
      |> Map.put("context", scoped_state_context)

    {scoped_state, serialized_snapshot} =
      reconsile_activated_at(scoped_state, serialized_snapshot)

    diff = MapDiff.diff(scoped_state, serialized_snapshot)

    matches = Map.get(diff, :changed) == :equal

    {matches, diff, scoped_state}
  end

  defp reconsile_activated_at(
         %{"context" => %{"activatedAt" => activated_at}} = a,
         %{"context" => %{"activatedAt" => activated_at}} = b
       )
       when not is_nil(activated_at) do
    {a, b}
  end

  defp reconsile_activated_at(
         scoped_state,
         %{"context" => %{"activatedAt" => activated_at}} = serialized_context
       )
       when not is_nil(activated_at) do
    {put_in(scoped_state, ["context", "activatedAt"], activated_at), serialized_context}
  end

  defp reconsile_activated_at(a, b) do
    {a, b}
  end

  defp serialize_snapshot(detour) do
    %{
      "value" => state_from_detour(detour),
      "status" => "active",
      "context" => context_from_detour(detour),
      "children" => snapshot_children_from_detour(detour),
      "historyValue" => %{}
    }
  end

  defp validate_serialized_snapshot(%Detour{id: id} = detour) do
    serialized_snapshot = serialize_snapshot(detour)
    {matches, diff, scoped_state} = compare_snapshots(detour, serialized_snapshot)

    if matches do
      serialized_snapshot
    else
      scoped_state = fix_snapshot_activated_at(scoped_state, detour)
      Sentry.capture_message(mismatch_message(id), extra: %{diff: diff})

      Logger.error("#{mismatch_message(id)} #{diff_details(diff)}")

      scoped_state
    end
  end

  defp mismatch_message(id) do
    "Serialized detour doesn't match saved snapshot. Falling back to snapshot for detour_id=#{id}"
  end

  defp diff_details(diff) do
    diff
    |> Map.delete(:value)
    |> Enum.map_join(
      " ",
      fn {key, val} ->
        "#{key}=#{inspect(val, printable_limit: :infinity, limit: :infinity)}"
      end
    )
  end

  # BUG FIX:
  # if `activated_at` is present but `validate_serialized_snapshot` failed, then
  # we need to make sure that the `activatedAt` `context` value is added.
  defp fix_snapshot_activated_at(snapshot, %Detour{activated_at: %DateTime{}} = detour) do
    put_in(snapshot["context"]["activatedAt"], activated_at_from_detour(detour))
  end

  # If `activated_at` is otherwise invalid, return the existing snapshot
  defp fix_snapshot_activated_at(snapshot, _detour) do
    snapshot
  end

  # For each of these retrieve functions, the first function is the one
  # that will look for the correct field on the db object, once the detour state
  # is properly distributed across db tables / columns.
  #
  # The second function is the fallback that uses the existing state snapshot.
  #
  # Note that the first function is only stubbed out and will be significantly updated
  # when the new fields are added to the db. For example, `get_route_from_db_detour`
  # suggests that the field `route` will be surfaced at the top level of the detour
  # but actually, it may be nested under `route_pattern` or however else we organize
  # it in the db.

  defp context_from_detour(%Detour{} = detour) do
    :maps.filter(fn _, v -> v != nil end, %{
      "uuid" => uuid_from_detour(detour),
      "route" => route_from_detour(detour),
      "routePattern" => routepattern_from_detour(detour),
      "routePatterns" => routepatterns_from_detour(detour),
      "startPoint" => startpoint_from_detour(detour),
      "endPoint" => endpoint_from_detour(detour),
      "waypoints" => waypoints_from_detour(detour),
      "nearestIntersection" => nearestintersection_from_detour(detour),
      "detourShape" => detourshape_from_detour(detour),
      "finishedDetour" => finisheddetour_from_detour(detour),
      "editedDirections" => editeddirections_from_detour(detour),
      "selectedDuration" => selectedduration_from_detour(detour),
      "selectedReason" => selectedreason_from_detour(detour),
      "activatedAt" => activated_at_from_detour(detour)
    })
  end

  defmacrop log_fallback(field) do
    quote do
      Logger.warning("Unexpected detour structure. Using snapshot for field: #{unquote(field)}")
    end
  end

  # defp state_from_detour(%Detour{detour_state: state}), do: state
  defp state_from_detour(%Detour{
         state: %{
           "value" => state
         }
       }) do
    log_fallback("state")
    state
  end

  defp state_from_detour(_), do: nil

  defp uuid_from_detour(%Detour{id: id}), do: id

  # defp route_from_detour(%Detour{route: route}), do: route
  defp route_from_detour(%Detour{
         state: %{
           "context" => %{
             "route" => route
           }
         }
       }) do
    log_fallback("route")
    route
  end

  defp route_from_detour(_), do: nil

  # defp routepattern_from_detour(%Detour{route_pattern: route_pattern}), do: route_pattern
  defp routepattern_from_detour(%Detour{
         state: %{
           "context" => %{
             "routePattern" => route_pattern
           }
         }
       }) do
    log_fallback("routePattern")
    route_pattern
  end

  defp routepattern_from_detour(_), do: nil

  # defp routepatterns_from_detour(%Detour{route_patterns: route_patterns}), do: route_patterns
  defp routepatterns_from_detour(%Detour{
         state: %{
           "context" => %{
             "routePatterns" => route_patterns
           }
         }
       }) do
    log_fallback("route_patterns")
    route_patterns
  end

  defp routepatterns_from_detour(_), do: nil

  # defp startpoint_from_detour(%Detour{start_point: start_point}), do: start_point
  defp startpoint_from_detour(%Detour{
         state: %{
           "context" => %{
             "startPoint" => start_point
           }
         }
       }) do
    log_fallback("startPoint")
    start_point
  end

  defp startpoint_from_detour(_), do: nil

  # defp endpoint_from_detour(%Detour{end_point: end_point}), do: end_point
  defp endpoint_from_detour(%Detour{
         state: %{
           "context" => %{
             "endPoint" => end_point
           }
         }
       }) do
    log_fallback("endPoint")
    end_point
  end

  defp endpoint_from_detour(_), do: nil

  # defp waypoints_from_detour(%Detour{waypoints: waypoints}), do: waypoints
  defp waypoints_from_detour(%Detour{
         state: %{
           "context" => %{
             "waypoints" => waypoints
           }
         }
       }) do
    log_fallback("waypoints")
    waypoints
  end

  defp waypoints_from_detour(_), do: nil

  # defp nearestintersection_from_detour(%Detour{nearest_intersection: nearest_intersection}), do: nearest_intersection
  defp nearestintersection_from_detour(%Detour{
         state: %{
           "context" => %{
             "nearestIntersection" => nearest_intersection
           }
         }
       }) do
    log_fallback("nearestIntersection")
    nearest_intersection
  end

  defp nearestintersection_from_detour(_), do: nil

  # defp detourshape_from_detour(%Detour{detour_shape: detour_shape}), do: detour_shape
  defp detourshape_from_detour(%Detour{
         state: %{
           "context" => %{
             "detourShape" => detour_shape
           }
         }
       }) do
    log_fallback("detourShape")
    detour_shape
  end

  defp detourshape_from_detour(_), do: nil

  # defp finisheddetour_from_detour(%Detour{finished_detour: finished_detour}), do: finished_detour
  defp finisheddetour_from_detour(%Detour{
         state: %{
           "context" => %{
             "finishedDetour" => finished_detour
           }
         }
       }) do
    log_fallback("finishedDetour")
    finished_detour
  end

  defp finisheddetour_from_detour(_), do: nil

  # defp editeddirections_from_detour(%Detour{finished_detour: finished_detour}), do: finished_detour
  defp editeddirections_from_detour(%Detour{
         state: %{
           "context" => %{
             "editedDirections" => edited_directions
           }
         }
       }) do
    log_fallback("editedDirections")
    edited_directions
  end

  defp editeddirections_from_detour(_), do: nil

  # defp selectedduration_from_detour(%Detour{snapshot_children: snapshot_children}), do: snapshot_children
  defp selectedduration_from_detour(%Detour{
         state: %{
           "context" => %{
             "selectedDuration" => selected_duration
           }
         }
       }) do
    log_fallback("selectedDuration")
    selected_duration
  end

  defp selectedduration_from_detour(_), do: nil

  # defp selectedreason_from_detour(%Detour{snapshot_children: snapshot_children}), do: snapshot_children
  defp selectedreason_from_detour(%Detour{
         state: %{
           "context" => %{
             "selectedReason" => selected_reason
           }
         }
       }) do
    log_fallback("selectedReason")
    selected_reason
  end

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

  # defp snapshot_children_from_detour(%Detour{snapshot_children: snapshot_children}), do: snapshot_children
  defp snapshot_children_from_detour(%Detour{
         state: %{
           "children" => snapshot_children
         }
       }) do
    log_fallback("children")
    snapshot_children
  end

  defp snapshot_children_from_detour(_), do: nil
end
