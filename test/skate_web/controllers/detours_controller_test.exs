defmodule SkateWeb.DetoursControllerTest do
  alias Realtime.Shape
  alias Realtime.TripModification
  alias Skate.OpenRouteServiceAPI.DirectionsRequest
  use SkateWeb.ConnCase

  import Test.Support.Helpers
  import Mox
  import Skate.Factory

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

      %Skate.Detours.Db.Detour{id: id, state: snapshot} = insert(:detour)

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

  defp populate_db_and_get_user(conn) do
    # Active detour
    put(conn, "/api/detours/update_snapshot", %{
      "snapshot" => %{
        "context" => %{
          "route" => %{
            "name" => "23",
            "directionNames" => %{
              "0" => "Outbound",
              "1" => "Inbound"
            }
          },
          "routePattern" => %{
            "headsign" => "Headsign",
            "directionId" => 0
          },
          "nearestIntersection" => "Street A & Avenue B",
          "uuid" => 1
        },
        "value" => %{"Detour Drawing" => %{"Active" => "Reviewing"}}
      }
    })

    # Past detour
    put(conn, "/api/detours/update_snapshot", %{
      "snapshot" => %{
        "context" => %{
          "route" => %{
            "name" => "47",
            "directionNames" => %{
              "0" => "Outbound",
              "1" => "Inbound"
            }
          },
          "routePattern" => %{
            "headsign" => "Headsign",
            "directionId" => 1
          },
          "nearestIntersection" => "Street C & Avenue D",
          "uuid" => 2
        },
        "value" => %{"Detour Drawing" => "Past"}
      }
    })

    # Draft detour
    put(conn, "/api/detours/update_snapshot", %{
      "snapshot" => %{
        "context" => %{
          "route" => %{
            "name" => "75",
            "directionNames" => %{
              "0" => "Outbound",
              "1" => "Inbound"
            }
          },
          "routePattern" => %{
            "headsign" => "Headsign",
            "directionId" => 0
          },
          "nearestIntersection" => "Street Y & Avenue Z",
          "uuid" => 3
        }
      }
    })

    1
    |> Detours.get_detour!()
    |> Map.get(:author_id)
  end

  describe "detour/2" do
    @tag :authenticated
    test "fetches single detour with its state from database", %{conn: conn} do
      populate_db_and_get_user(conn)

      conn = get(conn, "/api/detours/1")

      json_response(conn, 200)

      assert %{
               "data" => %{
                 "author" => "test_user@test.com",
                 "state" => %{
                   "context" => %{
                     "nearestIntersection" => "Street A & Avenue B",
                     "route" => %{
                       "directionNames" => %{"0" => "Outbound", "1" => "Inbound"},
                       "name" => "23"
                     },
                     "routePattern" => %{"directionId" => 0, "headsign" => "Headsign"},
                     "uuid" => 1
                   },
                   "value" => %{"Detour Drawing" => %{"Active" => "Reviewing"}}
                 },
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
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street A & Avenue B",
                     "name" => "Headsign",
                     "route" => "23",
                     "status" => "active",
                     "updated_at" => _
                   }
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
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

      Skate.Settings.User.upsert("other_user", "other_user@gmail.com")

      other_user = Skate.Settings.User.get_by_email("other_user@gmail.com")

      # Manually insert a detour by another user
      Detours.update_or_create_detour_for_user(other_user.id, 10, %{
        state: %{
          "context" => %{
            "route" => %{
              "name" => "23",
              "directionNames" => %{
                "0" => "Outbound",
                "1" => "Inbound"
              }
            },
            "routePattern" => %{
              "headsign" => "Headsign",
              "directionId" => 0
            },
            "nearestIntersection" => "Street A & Avenue B",
            "uuid" => 10
          }
        }
      })

      conn = get(conn, ~p"/api/detours")

      assert %{
               "data" => %{
                 "active" => [
                   %{
                     "author_id" => ^current_user_id,
                     "direction" => "Outbound",
                     "intersection" => "Street A & Avenue B",
                     "name" => "Headsign",
                     "route" => "23",
                     "status" => "active",
                     "updated_at" => _
                   }
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^current_user_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
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
              "name" => "23"
            },
            "routePattern" => %{
              "headsign" => "Headsign",
              "directionId" => 0
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
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street A & Avenue B",
                     "name" => "Headsign",
                     "route" => "23",
                     "status" => "active",
                     "updated_at" => _
                   }
                 ],
                 "draft" => [
                   %{
                     "author_id" => ^author_id,
                     "direction" => "Outbound",
                     "intersection" => "Street Y & Avenue Z",
                     "name" => "Headsign",
                     "route" => "75",
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
                   "type" => 1
                 },
                 %{
                   "instruction" => "2",
                   "type" => 0
                 }
               ]
             },
             %{
               "steps" => [
                 %{
                   "instruction" => "3",
                   "type" => 2
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
                     %{"instruction" => "1"},
                     %{"instruction" => "2"},
                     %{"instruction" => "3"}
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
end
