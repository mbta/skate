defmodule Swiftly.API.ServiceAdjustmentsTest do
  use ExUnit.Case
  import ExUnit.CaptureLog

  @mock_client_module Swiftly.API.MockClient

  setup_all do
    Mox.defmock(@mock_client_module, for: Swiftly.API.Client)

    :ok
  end

  @default_arguments [
    client: @mock_client_module,
    base_url: URI.parse("https://localhost"),
    agency: "fake-agency",
    api_key: "fake-api-key"
  ]

  describe "all" do
    for %{api_call: api_call, name: name} <- [
          %{
            name: "create_adjustment_v1/2",
            api_call:
              quote do
                Swiftly.API.ServiceAdjustments.create_adjustment_v1(
                  %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
                  @default_arguments
                )
              end
          },
          %{
            name: "delete_adjustment/2",
            api_call:
              quote do
                Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
                  "test-adjustment-id",
                  @default_arguments
                )
              end
          },
          %{
            name: "get_adjustments_v1/1",
            api_call:
              quote do
                Swiftly.API.ServiceAdjustments.get_adjustments_v1(@default_arguments)
              end
          }
        ] do
      test "endpoint requests have `authorization` header (#{name})" do
        Mox.expect(@mock_client_module, :request, fn request ->
          %HTTPoison.Request{
            headers: headers
          } = request

          assert headers[:authorization] == "fake-api-key"
        end)

        Code.eval_quoted(unquote(api_call))
      end

      test "endpoint requests have `accept: application/json` header (#{name})" do
        Mox.expect(@mock_client_module, :request, fn request ->
          %HTTPoison.Request{
            headers: headers
          } = request

          assert headers[:accept] == "application/json"
        end)

        Code.eval_quoted(unquote(api_call))
      end

      test "endpoint requests have `agency` parameter (#{name})" do
        Mox.expect(@mock_client_module, :request, fn request ->
          %HTTPoison.Request{
            params: params
          } = request

          assert params[:agency] == "fake-agency"
        end)

        Code.eval_quoted(unquote(api_call))
      end

      test "endpoints, when client errors, log and return {:error, :unknown} (#{name})" do
        Mox.expect(@mock_client_module, :request, fn _ ->
          {:error,
           %HTTPoison.Error{
             reason: "closed"
           }}
        end)

        {result, log} =
          with_log(fn ->
            {result, _binding} = Code.eval_quoted(unquote(api_call))
            result
          end)

        assert result == {:error, :unknown}

        assert log =~ "mfa=Swiftly.API.ServiceAdjustments."
        assert log =~ "unknown"
        assert log =~ "response={:error, %HTTPoison.Error{reason: \"closed\", id: nil}}"
      end
    end
  end

  describe "create_adjustment_v1/2" do
    test "HTTP method is :post" do
      Mox.expect(@mock_client_module, :request, fn request ->
        assert %HTTPoison.Request{
                 method: :post
               } = request
      end)

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
        @default_arguments
      )
    end

    test "url ends with `/adjustments`" do
      Mox.expect(@mock_client_module, :request, 1, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/adjustments"
               } = request
      end)

      Mox.expect(@mock_client_module, :request, 2, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/test-prefix/adjustments"
               } = request
      end)

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
        [base_url: URI.parse("https://localhost")] ++
          @default_arguments
      )

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
        [base_url: URI.parse("https://localhost/test-prefix")] ++
          @default_arguments
      )
    end

    test "when API returns `200`, returns parsed struct" do
      adjustment_id = "test_adjustment_id"

      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 200,
           body: Jason.encode!(%{adjustmentId: adjustment_id})
         }}
      end)

      assert {:ok,
              %Swiftly.API.ServiceAdjustments.AdjustmentIdResponse{adjustmentId: adjustment_id}} ==
               Swiftly.API.ServiceAdjustments.create_adjustment_v1(
                 %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
                 @default_arguments
               )
    end

    test "when API returns 400, logs and returns {:error, :bad_request}" do
      response_body =
        Jason.encode!(%{
          errorCode: 400,
          errorMessage: "Request failed with status code 400"
        })

      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 400,
           body: response_body,
           request_url: request.url
         }}
      end)

      {result, log} =
        with_log(fn ->
          Swiftly.API.ServiceAdjustments.create_adjustment_v1(
            %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
            @default_arguments
          )
        end)

      assert result == {:error, :bad_request}

      assert log =~ "mfa=Swiftly.API.ServiceAdjustments.create_adjustment_v1/2"
      assert log =~ "status_code=400"
      assert log =~ "request_url=\"https://localhost/adjustments\""
      assert log =~ "body=#{inspect(response_body)}"
    end

    test "request `body` is encoded as json" do
      begin_time = DateTime.utc_now()

      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          body: body
        } = request

        assert %{
                 "feedId" => "test_feed_id",
                 "feedName" => "test_feed_name",
                 "notes" => "test_note",
                 "details" => %{
                   "adjustmentType" => "DETOUR_V0",
                   "beginTime" => DateTime.to_iso8601(begin_time),
                   "detourRouteDirectionDetails" => %{
                     "direction" => "1",
                     "routeShortName" => "route_name",
                     "shape" => [[0, 0], [1, 0]],
                     "skippedStops" => ["stop_1", "stop_2"]
                   }
                 }
               } == Jason.decode!(body)
      end)

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{
          feedId: "test_feed_id",
          feedName: "test_feed_name",
          notes: "test_note",
          details: %Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1{
            beginTime: begin_time,
            detourRouteDirectionDetails:
              %Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails{
                direction: "1",
                routeShortName: "route_name",
                shape: [
                  [0, 0],
                  [1, 0]
                ],
                skippedStops: [
                  "stop_1",
                  "stop_2"
                ]
              }
          }
        },
        @default_arguments
      )
    end

    test "request integrates `feedId` and `feedName` from opts config" do
      begin_time = DateTime.utc_now()

      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          body: body
        } = request

        assert %{
                 "feedId" => "test_feed_id",
                 "feedName" => "test_feed_name",
                 "notes" => "test_note",
                 "details" => %{
                   "adjustmentType" => "DETOUR_V0",
                   "beginTime" => DateTime.to_iso8601(begin_time),
                   "detourRouteDirectionDetails" => %{
                     "direction" => "1",
                     "routeShortName" => "route_name",
                     "shape" => [[0, 0], [1, 0]],
                     "skippedStops" => ["stop_1", "stop_2"]
                   }
                 }
               } == Jason.decode!(body)
      end)

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{
          notes: "test_note",
          details: %Swiftly.API.ServiceAdjustments.DetourV0CreationDetailsV1{
            beginTime: begin_time,
            detourRouteDirectionDetails:
              %Swiftly.API.ServiceAdjustments.DetourRouteDirectionCreationDetails{
                direction: "1",
                routeShortName: "route_name",
                shape: [
                  [0, 0],
                  [1, 0]
                ],
                skippedStops: [
                  "stop_1",
                  "stop_2"
                ]
              }
          }
        },
        [feed_id: "test_feed_id", feed_name: "test_feed_name"] ++ @default_arguments
      )
    end

    test "request `content-type` header is json" do
      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          headers: headers
        } = request

        assert headers[:"content-type"] == "application/json"
      end)

      Swiftly.API.ServiceAdjustments.create_adjustment_v1(
        %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
        @default_arguments
      )
    end
  end

  describe "delete_adjustment_v1/2" do
    test "HTTP method is :delete" do
      Mox.expect(@mock_client_module, :request, fn request ->
        assert %HTTPoison.Request{
                 method: :delete
               } = request
      end)

      Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
        "test-adjustment-id",
        @default_arguments
      )
    end

    test "url ends with `/adjustments/:adjustment_id`" do
      Mox.expect(@mock_client_module, :request, 1, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/adjustments/test-adjustment-id"
               } = request
      end)

      Mox.expect(@mock_client_module, :request, 2, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/test-prefix/adjustments/test-adjustment-id"
               } = request
      end)

      Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
        "test-adjustment-id",
        [base_url: URI.parse("https://localhost")] ++
          @default_arguments
      )

      Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
        "test-adjustment-id",
        [base_url: URI.parse("https://localhost/test-prefix")] ++
          @default_arguments
      )
    end

    test "when API returns `204`, returns :ok" do
      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 204
         }}
      end)

      assert :ok ==
               Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
                 "test-adjustment-id",
                 @default_arguments
               )
    end

    test "when API returns 400, logs and returns {:error, :bad_request}" do
      response_body =
        Jason.encode!(%{
          errorCode: 400,
          errorMessage: "Request failed with status code 400"
        })

      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 400,
           body: response_body,
           request_url: request.url
         }}
      end)

      {result, log} =
        with_log(fn ->
          Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
            "test-adjustment-id",
            @default_arguments
          )
        end)

      assert result == {:error, :bad_request}

      assert log =~ "mfa=Swiftly.API.ServiceAdjustments.delete_adjustment_v1/2"
      assert log =~ "status_code=400"
      assert log =~ "request_url=\"https://localhost/adjustments/test-adjustment-id\""
      assert log =~ "body=#{inspect(response_body)}"
    end

    test "when API returns 404, logs and returns {:error, :not_found}" do
      response_body =
        Jason.encode!(%{
          errorCode: 404
        })

      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 404,
           body: response_body,
           request_url: request.url
         }}
      end)

      {result, log} =
        with_log(fn ->
          Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
            "test-adjustment-id",
            @default_arguments
          )
        end)

      assert result == {:error, :not_found}

      assert log =~ "mfa=Swiftly.API.ServiceAdjustments.delete_adjustment_v1/2"
      assert log =~ "status_code=404"
      assert log =~ "request_url=\"https://localhost/adjustments/test-adjustment-id\""
      assert log =~ "body=#{inspect(response_body)}"
    end

    test "retrieves `feedId` parameter from opts" do
      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          params: params
        } = request

        assert params[:feedId] == "fake-feed-id"
      end)

      Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
        "test-adjustment-id",
        [feedId: "fake-feed-id"] ++ @default_arguments
      )
    end

    test "retrieves snake_case `feed_id` parameter from config opts" do
      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          params: params
        } = request

        assert params[:feedId] == "fake-feed-id"
      end)

      Swiftly.API.ServiceAdjustments.delete_adjustment_v1(
        "test-adjustment-id",
        [feed_id: "fake-feed-id"] ++ @default_arguments
      )
    end
  end

  describe "get_adjustments_v1/1" do
    test "HTTP method is :get" do
      Mox.expect(@mock_client_module, :request, fn request ->
        assert %HTTPoison.Request{
                 method: :get
               } = request
      end)

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(@default_arguments)
    end

    test "url ends with `/adjustments`" do
      Mox.expect(@mock_client_module, :request, 1, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/adjustments"
               } = request
      end)

      Mox.expect(@mock_client_module, :request, 2, fn request ->
        assert %HTTPoison.Request{
                 url: "https://localhost/test-prefix/adjustments"
               } = request
      end)

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(
        [base_url: URI.parse("https://localhost")] ++
          @default_arguments
      )

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(
        [base_url: URI.parse("https://localhost/test-prefix")] ++
          @default_arguments
      )
    end

    test "when API returns `200`, returns parsed struct" do
      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 200,
           body:
             Jason.encode!(%{
               adjustments: [
                 %{
                   adjustmentType: "DETOUR_V0",
                   notes: "test-note-1",
                   status: "ACTIVE",
                   feedId: "test-feed-id",
                   validity: "VALID"
                 },
                 %{
                   adjustmentType: "DETOUR_V0",
                   notes: "test-note-2",
                   status: "ACTIVE",
                   feedId: "test-feed-id",
                   validity: "INVALID"
                 }
               ]
             })
         }}
      end)

      assert {:ok,
              %Swiftly.API.ServiceAdjustments.AdjustmentsResponseV1{
                adjustments: [
                  %Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1{
                    adjustmentType: "DETOUR_V0",
                    notes: "test-note-1",
                    status: "ACTIVE",
                    feedId: "test-feed-id",
                    validity: "VALID",
                    id: nil,
                    originalId: nil,
                    validityReason: nil
                  },
                  %Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1{
                    adjustmentType: "DETOUR_V0",
                    notes: "test-note-2",
                    status: "ACTIVE",
                    feedId: "test-feed-id",
                    validity: "INVALID",
                    id: nil,
                    originalId: nil,
                    validityReason: nil
                  }
                ]
              }} ==
               Swiftly.API.ServiceAdjustments.get_adjustments_v1(@default_arguments)
    end

    test "when API returns 400, logs and returns {:error, :bad_request}" do
      response_body =
        Jason.encode!(%{
          errorCode: 400,
          errorMessage: "Request failed with status code 400"
        })

      Mox.expect(@mock_client_module, :request, fn request ->
        {:ok,
         %HTTPoison.Response{
           request: request,
           status_code: 400,
           body: response_body,
           request_url: request.url
         }}
      end)

      {result, log} =
        with_log(fn ->
          Swiftly.API.ServiceAdjustments.get_adjustments_v1(@default_arguments)
        end)

      assert result == {:error, :bad_request}

      assert log =~ "mfa=Swiftly.API.ServiceAdjustments.get_adjustments_v1/1"
      assert log =~ "status_code=400"
      assert log =~ "request_url=\"https://localhost/adjustments\""
      assert log =~ "body=#{inspect(response_body)}"
    end

    test "encodes `adjustmentTypes` as JSON array" do
      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          params: params
        } = request

        assert Jason.decode!(params[:adjustmentTypes]) == ["DETOUR_V0"]
      end)

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(
        [adjustmentTypes: [:DETOUR_V0]] ++
          @default_arguments
      )
    end

    test "encodes `validityStates` as JSON array" do
      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          params: params
        } = request

        assert Jason.decode!(params[:validityStates]) == ["INVALID", "PENDING", "VALID"]
      end)

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(
        [validityStates: [:INVALID, :PENDING, :VALID]] ++
          @default_arguments
      )
    end

    test "encodes `createdBefore` as ISO8601" do
      created_before = DateTime.utc_now()

      Mox.expect(@mock_client_module, :request, fn request ->
        %HTTPoison.Request{
          params: params
        } = request

        assert params[:createdBefore] ==
                 created_before
                 |> DateTime.shift_zone!("America/New_York")
                 |> DateTime.to_iso8601()
      end)

      Swiftly.API.ServiceAdjustments.get_adjustments_v1(
        [createdBefore: created_before] ++
          @default_arguments
      )
    end
  end
end
