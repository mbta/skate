defmodule SkateWeb.DetoursControllerTest do
  alias Realtime.Shape
  alias Realtime.TripModification
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use SkateWeb.ConnCase

  import Test.Support.Helpers
  import Mox
  import Skate.Factory

  alias ExUnit.CaptureLog

  alias Skate.Detours.Detours
  alias Skate.Detours.MissedStops

  setup do
    stub(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
      {:ok, build(:ors_directions_json)}
    end)

    stub(Skate.Detours.MockTripModificationPublisher, :publish_modification, fn _, _, _ -> nil end)

    reassign_env(:skate_web, :missed_stops_fn, fn _ -> build(:missed_stops_result) end)
    reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> build(:shape_with_stops) end)

    :ok
  end

  setup :verify_on_exit!

  describe "update_snapshot/2" do
    @tag :authenticated
    test "adds new detour to database", %{conn: conn} do
      conn =
        put(conn, "/api/detours/update_snapshot", %{
          "snapshot" => %{"context" => %{}}
        })

      assert %{"data" => number} = json_response(conn, 200)

      assert %Skate.Detours.Db.Detour{
               id: ^number,
               state: %{"context" => %{}}
             } = Detours.get_detour!(number)
    end

    defp setup_notification_server do
      registry_name = :new_notifications_registry
      start_supervised({Registry, keys: :duplicate, name: registry_name})
      reassign_env(:notifications, :registry, registry_name)

      start_link_supervised!(Notifications.NotificationServer)
    end

    @tag :authenticated
    test "updates detour in database if detour uuid provided", %{conn: conn} do
      conn =
        put(conn, "/api/detours/update_snapshot", %{
          "snapshot" => %{"context" => %{"uuid" => 8}}
        })

      assert %{"data" => 8} = json_response(conn, 200)

      assert %Skate.Detours.Db.Detour{
               id: 8,
               state: %{"context" => %{"uuid" => 8}}
             } = Detours.get_detour!(8)
    end

    @tag :authenticated
    test "updates :status to match snapshot", %{conn: conn} do
      setup_notification_server()

      draft_id = 1
      activated_id = 2
      past_id = 3

      conn
      # Draft Detour
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> with_id(draft_id)
      })

      # Activated Detour
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> with_id(activated_id)
      })
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> activated |> with_id(activated_id)
      })

      # Deactivated Detour
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> with_id(past_id)
      })
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> activated |> with_id(past_id)
      })
      |> put(~p"/api/detours/update_snapshot", %{
        "snapshot" => :detour_snapshot |> build() |> deactivated |> with_id(past_id)
      })

      Process.sleep(10)
      assert Skate.Detours.Detours.get_detour!(draft_id).status === :draft
      assert Skate.Detours.Detours.get_detour!(activated_id).status === :active
      assert Skate.Detours.Detours.get_detour!(past_id).status === :past
    end

    @tag :authenticated
    test "creates a new notification when detour is activated", %{conn: conn} do
      setup_notification_server()

      %Skate.Detours.Db.Detour{id: id, state: snapshot} = insert(:detour)

      put(conn, ~p"/api/detours/update_snapshot", %{
        "snapshot" => snapshot |> activated |> with_id(id)
      })

      Process.sleep(10)
      assert Skate.Repo.aggregate(Notifications.Db.Detour, :count) == 1
    end

    @tag :authenticated
    test "adds `activated_at` field when provided", %{conn: conn} do
      %Skate.Detours.Db.Detour{id: id, state: snapshot, activated_at: nil} = insert(:detour)

      activated_at_time =
        DateTime.utc_now() |> Skate.DetourFactory.browser_date() |> Skate.DetourFactory.db_date()

      put(conn, ~p"/api/detours/update_snapshot", %{
        "snapshot" => snapshot |> activated(activated_at_time) |> with_id(id)
      })

      Process.sleep(10)

      assert Skate.Detours.Detours.get_detour!(id).activated_at ==
               activated_at_time
    end

    @tag :authenticated
    test "does not create a new notification if detour was already activated", %{conn: conn} do
      setup_notification_server()

      %Skate.Detours.Db.Detour{id: id, state: snapshot} =
        :detour |> build |> activated |> insert

      put(conn, ~p"/api/detours/update_snapshot", %{
        "snapshot" => with_id(snapshot, id)
      })

      Process.sleep(10)
      assert Skate.Repo.aggregate(Notifications.Db.Detour, :count) == 0
    end

    @tag :authenticated
    test "creates a new notification when detour is deactivated", %{conn: conn} do
      setup_notification_server()

      %Skate.Detours.Db.Detour{id: id, state: snapshot} =
        detour = :detour |> build |> activated |> insert()

      %Skate.Detours.Db.DetourExpirationTask{} =
        :detour_expiration_task |> build(detour: detour) |> insert()

      put(conn, ~p"/api/detours/update_snapshot", %{
        "snapshot" => snapshot |> deactivated |> with_id(id)
      })

      Process.sleep(10)
      assert Skate.Repo.aggregate(Notifications.Db.Detour, :count) == 1
    end

    @tag :authenticated
    test "does not create a new notification if detour was already deactivated", %{conn: conn} do
      setup_notification_server()

      %Skate.Detours.Db.Detour{id: id, state: snapshot} =
        :detour |> build |> deactivated |> insert

      put(conn, ~p"/api/detours/update_snapshot", %{
        "snapshot" => with_id(snapshot, id)
      })

      Process.sleep(10)
      assert Skate.Repo.aggregate(Notifications.Db.Detour, :count) == 0
    end
  end

  @tag :authenticated
  test "when a detour is deactivated, then the detour's expiration task is deleted", %{conn: conn} do
    %Skate.Detours.Db.Detour{id: id, state: snapshot} =
      detour = :detour |> build |> activated |> insert()

    %Skate.Detours.Db.DetourExpirationTask{} =
      :detour_expiration_task |> build(detour: detour) |> insert()

    assert Skate.Repo.aggregate(Skate.Detours.Db.DetourExpirationTask, :count) == 1

    put(conn, ~p"/api/detours/update_snapshot", %{
      "snapshot" => snapshot |> deactivated |> with_id(id)
    })

    assert Skate.Repo.aggregate(Skate.Detours.Db.DetourExpirationTask, :count) == 0
  end

  defp populate_db_and_get_user(conn) do
    # Active detour
    active_detour_snapshot =
      :detour_snapshot
      |> build()
      |> with_id(1)
      |> with_route_id("23")
      |> with_route_name("23")
      |> with_direction(:outbound)
      |> with_route_pattern_id("23-1-0")
      |> with_headsign("Headsign")
      |> with_nearest_intersection("Street A & Avenue B")

    conn =
      conn
      |> put("/api/detours/update_snapshot", %{"snapshot" => active_detour_snapshot})
      |> put("/api/detours/update_snapshot", %{
        "snapshot" => activated(active_detour_snapshot, ~U[2024-01-01 13:00:00.000000Z])
      })

    # Past detour
    deactivated_detour_snapshot =
      :detour_snapshot
      |> build()
      |> with_id(2)
      |> with_route_id("47")
      |> with_route_name("47")
      |> with_direction(:inbound)
      |> with_route_pattern_id("47-A-1")
      |> with_headsign("Headsign")
      |> with_nearest_intersection("Street C & Avenue D")

    conn =
      conn
      |> put("/api/detours/update_snapshot", %{"snapshot" => deactivated_detour_snapshot})
      |> put("/api/detours/update_snapshot", %{
        "snapshot" => activated(deactivated_detour_snapshot)
      })
      |> put("/api/detours/update_snapshot", %{
        "snapshot" => deactivated(deactivated_detour_snapshot)
      })

    # Draft detour
    draft_detour =
      :detour_snapshot
      |> build()
      |> with_id(3)
      |> with_route_id("75")
      |> with_route_name("75")
      |> with_direction(:outbound)
      |> with_route_pattern_id("75-2-0")
      |> with_headsign("Headsign")
      |> with_nearest_intersection("Street Y & Avenue Z")

    _conn =
      put(conn, "/api/detours/update_snapshot", %{"snapshot" => draft_detour})

    1
    |> Detours.get_detour!()
    |> Map.get(:author_id)
  end

  describe "detour/2" do
    @tag :authenticated
    test "fetches single detour with its state from database", %{
      conn: conn,
      user: %{email: email}
    } do
      populate_db_and_get_user(conn)

      conn = get(conn, "/api/detours/1")

      assert %{
               "data" => %{
                 "author" => ^email,
                 "state" => %{
                   "context" => %{
                     "nearestIntersection" => "Street A & Avenue B",
                     "route" => %{
                       "directionNames" => %{"0" => "Outbound", "1" => "Inbound"},
                       "name" => "23"
                     },
                     "routePattern" => %{
                       "directionId" => 0,
                       "headsign" => "Headsign",
                       "id" => "23-1-0"
                     },
                     "uuid" => 1
                   },
                   "value" => %{"Detour Drawing" => %{"Active" => "Reviewing"}}
                 },
                 "updated_at" => _
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "input snapshot matches the retrieved serialized detour", %{conn: conn} do
      detour_id = 4

      detour_snapshot =
        :detour_snapshot
        |> build()
        |> with_id(detour_id)

      put(conn, "/api/detours/update_snapshot", %{"snapshot" => detour_snapshot})

      {conn, log} =
        CaptureLog.with_log(fn ->
          get(conn, "/api/detours/#{detour_id}")
        end)

      refute log =~
               "Serialized detour doesn't match saved snapshot. Falling back to snapshot for detour_id=#{detour_id}"

      assert detour_snapshot == json_response(conn, 200)["data"]["state"]
    end

    @tag :authenticated
    test "serialized snapshot `activatedAt` value is formatted as iso-8601", %{conn: conn} do
      activated_at = Skate.DetourFactory.browser_date()

      %{id: id} =
        detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      # Make ID match snapshot
      detour
      |> Skate.Detours.Detours.change_detour(detour |> update_id() |> Map.from_struct())
      |> Skate.Repo.update!()

      {conn, log} =
        CaptureLog.with_log(fn ->
          get(conn, "/api/detours/#{id}")
        end)

      refute log =~
               "Serialized detour doesn't match saved snapshot. Falling back to snapshot for detour_id=#{id}"

      assert DateTime.to_iso8601(activated_at) ==
               json_response(conn, 200)["data"]["state"]["context"]["activatedAt"]
    end

    @tag :authenticated
    @tag :bug
    test "defers to `activated_at` column when serialized detour doesn't match saved snapshot and does not log error",
         %{
           conn: conn
         } do
      activated_at = Skate.DetourFactory.browser_date()

      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      # Make ID match snapshot
      snapshot = with_id(snapshot, id)
      # Old snapshots will not have this key populated
      {_value, snapshot} = pop_in(snapshot["context"]["activatedAt"])

      detour
      |> Skate.Detours.Detours.change_detour(%{state: snapshot})
      |> Skate.Repo.update!()

      {conn, log} =
        CaptureLog.with_log(fn ->
          get(conn, "/api/detours/#{id}")
        end)

      refute log =~
               "Serialized detour doesn't match saved snapshot. Falling back to snapshot for detour_id=#{id}"

      assert DateTime.to_iso8601(activated_at) ==
               json_response(conn, 200)["data"]["state"]["context"]["activatedAt"]
    end

    @tag :authenticated
    test "log an error if the serialized detour does not match db state", %{conn: conn} do
      detour_id = 4

      detour_snapshot =
        :detour_snapshot
        |> build()
        |> with_id(detour_id)

      conn = put(conn, "/api/detours/update_snapshot", %{"snapshot" => detour_snapshot})

      # Changing the status is a sure way to force a fallback, as it should always be "active"
      detour_id
      |> Detours.get_detour!()
      |> Detours.change_detour(%{state: put_in(detour_snapshot["status"], nil)})
      |> Skate.Repo.update()

      log =
        CaptureLog.capture_log(fn ->
          get(conn, "/api/detours/#{detour_id}")
        end)

      assert log =~
               "Serialized detour doesn't match saved snapshot. Falling back to snapshot for detour_id=#{detour_id}"
    end

    @tag :authenticated
    test "fallback to snapshot if the serialized detour does not match db state", %{conn: conn} do
      detour_id = 5

      detour_snapshot =
        :detour_snapshot
        |> build()
        |> with_id(detour_id)
        |> with_direction(:inbound)

      conn = put(conn, "/api/detours/update_snapshot", %{"snapshot" => detour_snapshot})

      edited_snapshot = put_in(detour_snapshot["context"]["routePattern"]["directionId"], 0)

      detour_id
      |> Detours.get_detour!()
      |> Detours.change_detour(%{state: edited_snapshot})
      |> Skate.Repo.update()

      conn = get(conn, "/api/detours/#{detour_id}")

      # Serializer returns the fallback original, instead of `"status" => "active"`,
      # which it sets for all successful serializations
      assert %{
               "data" => %{
                 "author" => _,
                 "state" => ^edited_snapshot,
                 "updated_at" => _
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "does not log an error if mismatch is an irrelevant field", %{conn: conn} do
      detour_id = 5

      detour_snapshot =
        :detour_snapshot
        |> build()
        |> with_id(detour_id)

      conn = put(conn, "/api/detours/update_snapshot", %{"snapshot" => detour_snapshot})

      edited_snapshot = put_in(detour_snapshot["irrelevantField"], "someData")

      detour_id
      |> Detours.get_detour!()
      |> Detours.change_detour(%{state: edited_snapshot})
      |> Skate.Repo.update()

      conn = get(conn, "/api/detours/#{detour_id}")

      # Serializer does not return the extra data
      assert %{
               "data" => %{
                 "author" => _,
                 "state" => ^detour_snapshot,
                 "updated_at" => _
               }
             } = json_response(conn, 200)
    end
  end

  describe "detours/2" do
    @tag :authenticated
    test "fetches detours from database and groups by active, past, draft", %{conn: conn} do
      author_id = populate_db_and_get_user(conn)

      conn = get(conn, ~p"/api/detours")

      assert %{
               "data" => %{
                 "active" => [
                   %{
                     "details" => %{
                       "author_id" => ^author_id,
                       "direction" => "Outbound",
                       "intersection" => "Street A & Avenue B",
                       "name" => "Headsign",
                       "route" => "23",
                       "via_variant" => "1",
                       "status" => "active",
                       "updated_at" => _
                     }
                   }
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
                     "via_variant" => "2",
                     "status" => "draft",
                     "updated_at" => _
                   }
                 ],
                 "past" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Inbound",
                     "intersection" => "Street C & Avenue D",
                     "name" => "Headsign",
                     "route" => "47",
                     "via_variant" => "A",
                     "status" => "past",
                     "updated_at" => _
                   }
                 ]
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "will not return detours from other users", %{conn: conn} do
      current_user_id = populate_db_and_get_user(conn)

      other_user = insert(:user)

      # Manually insert a detour by another user
      Detours.upsert_from_snapshot(
        other_user.id,
        build(:detour_snapshot)
      )

      conn = get(conn, ~p"/api/detours")

      assert %{
               "data" => %{
                 "active" => [
                   _
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^current_user_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
                     "via_variant" => "2",
                     "status" => "draft",
                     "updated_at" => _
                   }
                 ],
                 "past" => [
                   %{
                     "author_id" => ^current_user_id,
                     "direction" => "Inbound",
                     "intersection" => "Street C & Avenue D",
                     "name" => "Headsign",
                     "route" => "47",
                     "via_variant" => "A",
                     "status" => "past",
                     "updated_at" => _
                   }
                 ]
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "detours that have an old schema are omitted in the returned lists", %{conn: conn} do
      author_id = populate_db_and_get_user(conn)

      # Insert a detour with no headsign
      put(conn, "/api/detours/update_snapshot", %{
        "snapshot" => %{
          "context" => %{
            "route" => %{
              "id" => "23",
              "name" => "23",
              "directionNames" => %{
                "0" => "Outbound",
                "1" => "Inbound"
              }
            },
            "routePattern" => %{
              "directionId" => 0
            },
            "nearestIntersection" => "Street A & Avenue B",
            "uuid" => 4
          },
          "value" => %{"Detour Drawing" => %{"Active" => "Reviewing"}}
        }
      })

      # Insert a detour with no directionNames
      put(conn, "/api/detours/update_snapshot", %{
        "snapshot" => %{
          "context" => %{
            "route" => %{
              "id" => "23",
              "name" => "23"
            },
            "routePattern" => %{
              "headsign" => "Headsign",
              "directionId" => 0,
              "id" => "23-1-0"
            },
            "nearestIntersection" => "Street A & Avenue B",
            "uuid" => 5
          },
          "value" => %{"Detour Drawing" => %{"Active" => "Reviewing"}}
        }
      })

      conn = get(conn, ~p"/api/detours")

      assert %{
               "data" => %{
                 "active" => [
                   %{
                     "activated_at" => "2024-01-01T13:00:00.000000Z",
                     "details" => %{
                       "author_id" => ^author_id,
                       "direction" => "Outbound",
                       "intersection" => "Street A & Avenue B",
                       "name" => "Headsign",
                       "route" => "23",
                       "via_variant" => "1",
                       "status" => "active",
                       "updated_at" => _
                     }
                   }
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
                     "via_variant" => "2",
                     "status" => "draft",
                     "updated_at" => _
                   }
                 ],
                 "past" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Inbound",
                     "intersection" => "Street C & Avenue D",
                     "name" => "Headsign",
                     "route" => "47",
                     "via_variant" => "A",
                     "status" => "past",
                     "updated_at" => _
                   }
                 ]
               }
             } = json_response(conn, 200)
    end
  end

  describe "unfinished_detour/2" do
    @tag :authenticated
    test "returns unfinished route segments", %{conn: conn} do
      points = [
        build(:gtfs_shape_point, lat: 42.41, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.42, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.43, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.44, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.45, lon: -70.99)
      ]

      route_pattern = build(:gtfs_route_pattern)

      shape_with_stops =
        build(
          :shape_with_stops,
          %{points: points}
        )

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/unfinished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "unfinished_route_segments" => %{
                   "before_start_point" => [
                     %{"lat" => 42.41, "lon" => -70.99},
                     %{"lat" => 42.42, "lon" => -70.99},
                     %{"lat" => 42.425, "lon" => -70.99}
                   ],
                   "after_start_point" => [
                     %{"lat" => 42.425, "lon" => -70.99},
                     %{"lat" => 42.43, "lon" => -70.99},
                     %{"lat" => 42.44, "lon" => -70.99},
                     %{"lat" => 42.45, "lon" => -70.99}
                   ]
                 }
               }
             } = json_response(conn, 200)
    end
  end

  describe "finished_detour/2" do
    @tag :authenticated
    test "returns missed stops", %{conn: conn} do
      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)
      missed_stop = Enum.at(shape_with_stops.stops, 0)

      connection_start = Util.Location.as_location!(build(:gtfs_shape_point))
      connection_end = Util.Location.as_location!(build(:gtfs_shape_point))

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      reassign_env(:skate_web, :missed_stops_fn, fn %MissedStops{
                                                      connection_start: ^connection_start,
                                                      connection_end: ^connection_end,
                                                      stops: stops,
                                                      shape: shape
                                                    }
                                                    when stops == shape_with_stops.stops and
                                                           shape == shape_with_stops.points ->
        %MissedStops.Result{
          missed_stops: [missed_stop],
          connection_stop_start: nil,
          connection_stop_end: nil
        }
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      expected_missed_stop = Jason.decode!(Jason.encode!(missed_stop))

      assert %{"data" => %{"missed_stops" => [^expected_missed_stop]}} = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns connection points", %{conn: conn} do
      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      connection_start = shape_with_stops.points |> Enum.at(1) |> Util.Location.as_location!()
      connection_end = shape_with_stops.points |> Enum.at(2) |> Util.Location.as_location!()
      missed_stop = Enum.at(shape_with_stops.stops, 1)

      connection_stop_start = Enum.at(shape_with_stops.stops, 0)
      connection_stop_end = Enum.at(shape_with_stops.stops, 2)

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      reassign_env(:skate_web, :missed_stops_fn, fn %MissedStops{
                                                      connection_start: ^connection_start,
                                                      connection_end: ^connection_end,
                                                      stops: stops,
                                                      shape: shape
                                                    }
                                                    when stops == shape_with_stops.stops and
                                                           shape == shape_with_stops.points ->
        %MissedStops.Result{
          missed_stops: [missed_stop],
          connection_stop_start: connection_stop_start,
          connection_stop_end: connection_stop_end
        }
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      connection_stop_start = Jason.decode!(Jason.encode!(Enum.at(shape_with_stops.stops, 0)))
      connection_stop_end = Jason.decode!(Jason.encode!(Enum.at(shape_with_stops.stops, 2)))

      assert %{
               "data" => %{
                 "connection_stop_start" => ^connection_stop_start,
                 "connection_stop_end" => ^connection_stop_end
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns route segments", %{conn: conn} do
      points = [
        build(:gtfs_shape_point, lat: 42.41, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.42, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.43, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.44, lon: -70.99),
        build(:gtfs_shape_point, lat: 42.45, lon: -70.99)
      ]

      route_pattern = build(:gtfs_route_pattern)
      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)

      reassign_env(:skate_web, :shape_with_stops_fn, fn _ ->
        build(
          :shape_with_stops,
          %{points: points}
        )
      end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "route_segments" => %{
                   "before_detour" => [
                     %{"lat" => 42.41, "lon" => -70.99},
                     %{"lat" => 42.42, "lon" => -70.99},
                     %{"lat" => 42.425, "lon" => -70.99}
                   ],
                   "detour" => [
                     %{"lat" => 42.425, "lon" => -70.99},
                     %{"lat" => 42.43, "lon" => -70.99},
                     %{"lat" => 42.44, "lon" => -70.99},
                     %{"lat" => 42.445, "lon" => -70.99}
                   ],
                   "after_detour" => [
                     %{"lat" => 42.445, "lon" => -70.99},
                     %{"lat" => 42.45, "lon" => -70.99}
                   ]
                 }
               }
             } = json_response(conn, 200)
    end

    @tag :authenticated
    test "returns detour shape as geojson from ORS", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok, build(:ors_directions_json, coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      route_pattern = build(:gtfs_route_pattern)
      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "detour_shape" => %{
                   "coordinates" => [
                     %{"lat" => 0, "lon" => 0},
                     %{"lat" => 0.5, "lon" => 0.5},
                     %{"lat" => 1, "lon" => 1}
                   ]
                 }
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "returns turn-by-turn directions from ORS", %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn _ ->
        {:ok,
         build(:ors_directions_json,
           segments: [
             %{
               "steps" => [
                 %{
                   "instruction" => "1",
                   "type" => 1,
                   "name" => "A"
                 },
                 %{
                   "instruction" => "2",
                   "type" => 0,
                   "name" => "B"
                 }
               ]
             },
             %{
               "steps" => [
                 %{
                   "instruction" => "3",
                   "type" => 2,
                   "name" => "C"
                 }
               ]
             }
           ]
         )}
      end)

      route_pattern = build(:gtfs_route_pattern)
      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: route_pattern.id,
          connection_start: %{
            "lat" => 42.425,
            "lon" => -70.99
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{
            "lat" => 42.445,
            "lon" => -70.99
          }
        )

      assert %{
               "data" => %{
                 "detour_shape" => %{
                   "directions" => [
                     %{"instruction" => "R - A"},
                     %{"instruction" => "L - B"},
                     %{"instruction" => "L - C"}
                   ]
                 }
               }
             } =
               json_response(conn, 200)
    end

    @tag :authenticated
    test "formats coordinates as [lon, lat] when sending to ORS and includes the start and end points",
         %{conn: conn} do
      expect(Skate.OpenRouteServiceAPI.MockClient, :get_directions, fn request ->
        assert %DirectionsRequest{
                 coordinates: [
                   [-70.99, 42.425],
                   [-70.99, 42.431],
                   [-70.99, 42.439],
                   [-70.99, 42.445]
                 ]
               } = request

        {:ok, build(:ors_directions_json, coordinates: [[0, 0], [0.5, 0.5], [1, 1]])}
      end)

      route_pattern = build(:gtfs_route_pattern)
      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)

      post(conn, ~p"/api/detours/finished_detour",
        route_pattern_id: route_pattern.id,
        connection_start: %{
          "lat" => 42.425,
          "lon" => -70.99
        },
        waypoints: [
          %{
            "lat" => 42.431,
            "lon" => -70.99
          },
          %{
            "lat" => 42.439,
            "lon" => -70.99
          }
        ],
        connection_end: %{
          "lat" => 42.445,
          "lon" => -70.99
        }
      )
    end

    @tag :authenticated
    test "sends data to TripModificationPublisher", %{conn: conn} do
      route_pattern = build(:gtfs_route_pattern)
      shape_with_stops = build(:shape_with_stops)

      connection_start = Util.Location.as_location!(build(:gtfs_shape_point))
      connection_end = Util.Location.as_location!(build(:gtfs_shape_point))
      missed_stop = Enum.at(shape_with_stops.stops, 1)

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      reassign_env(:skate_web, :missed_stops_fn, fn _ ->
        build(:missed_stops_result,
          missed_stops: [missed_stop]
        )
      end)

      missed_stop_id = missed_stop.id
      representative_trip_id = route_pattern.representative_trip_id

      expect(
        Skate.Detours.MockTripModificationPublisher,
        :publish_modification,
        fn trip_modification, shape, opts ->
          assert %TripModification{
                   modifications: [
                     %TripModification.Modification{
                       start_stop_selector: %TripModification.StopSelector{
                         stop_id: ^missed_stop_id
                       },
                       end_stop_selector: %TripModification.StopSelector{stop_id: ^missed_stop_id}
                     }
                   ],
                   selected_trips: [
                     %TripModification.SelectedTrip{
                       trip_ids: [^representative_trip_id],
                       shape_id: shape_id
                     }
                   ]
                 } = trip_modification

          assert %Shape{
                   shape_id: ^shape_id
                 } = shape

          assert opts == [is_draft?: true]
        end
      )

      post(conn, ~p"/api/detours/finished_detour",
        route_pattern_id: route_pattern.id,
        waypoints: [
          %{
            "lat" => 42.431,
            "lon" => -70.99
          },
          %{
            "lat" => 42.439,
            "lon" => -70.99
          }
        ],
        connection_start: %{
          "lat" => connection_start.latitude,
          "lon" => connection_start.longitude
        },
        connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
      )
    end

    @tag :authenticated
    test "returns bad request if bad data is sent", %{conn: conn} do
      route_pattern = nil
      shape_with_stops = build(:shape_with_stops)

      connection_start = shape_with_stops.points |> Enum.at(0) |> Util.Location.as_location!()
      connection_end = shape_with_stops.points |> Enum.at(1) |> Util.Location.as_location!()

      reassign_env(:skate_web, :route_pattern_fn, fn _ -> route_pattern end)
      reassign_env(:skate_web, :shape_with_stops_fn, fn _ -> shape_with_stops end)

      conn =
        post(conn, ~p"/api/detours/finished_detour",
          route_pattern_id: "nonexistent_route_pattern",
          connection_start: %{
            "lat" => connection_start.latitude,
            "lon" => connection_start.longitude
          },
          waypoints: [
            %{
              "lat" => 42.431,
              "lon" => -70.99
            },
            %{
              "lat" => 42.439,
              "lon" => -70.99
            }
          ],
          connection_end: %{"lat" => connection_end.latitude, "lon" => connection_end.longitude}
        )

      assert response(conn, :bad_request)
    end
  end

  describe "delete_detour/2" do
    @tag :authenticated
    test "delete detour based on detour and author id", %{conn: conn} do
      populate_db_and_get_user(conn)
      conn = delete(conn, ~p"/api/detours/3")
      assert response(conn, :ok)
    end

    @tag :authenticated
    test "cannot delete another user's detour", %{conn: conn} do
      populate_db_and_get_user(conn)

      different_user = Skate.Factory.insert(:user)

      conn =
        Phoenix.ConnTest.build_conn()
        |> init_test_session(%{})
        |> Guardian.Plug.sign_in(SkateWeb.AuthManager, %{id: different_user.id}, %{})

      assert %Ecto.NoResultsError{} = catch_error(delete(conn, ~p"/api/detours/3"))
    end
  end
end
