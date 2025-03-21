defmodule Swiftly.API.ServiceAdjustmentsTest do
  use ExUnit.Case

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

      assert {:ok, %{adjustmentId: adjustment_id}} ==
               Swiftly.API.ServiceAdjustments.create_adjustment_v1(
                 %Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1{},
                 @default_arguments
               )
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
end
