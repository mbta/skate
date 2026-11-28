defmodule Skate.Radio.RttDataTest do
  use ExUnit.Case, async: true

  alias Skate.Radio.RttData

  setup do
    %{
      data: %{
        "id" => "100",
        "callType" => "RTT",
        "routeId" => "39",
        "routeName" => "39",
        "vehicleId" => "y501",
        "receivedAt" => "2026-09-22T15:51:24.8790282-04:00",
        "status" => "active"
      }
    }
  end

  test "defaults are RTT and active" do
    assert RttData.default_call_type() == "RTT"
    assert RttData.default_status() == "active"
  end

  test "accepts every call type and status", %{data: data} do
    for call_type <- ["Emergency", "PRTT", "RTT"], status <- ["unassigned", "active", "done"] do
      call = %{data | "callType" => call_type, "status" => status}
      assert {:ok, ^call} = RttData.validate(call)
    end
  end

  test "rejects missing and incorrectly typed required fields", %{data: data} do
    for field <- ~w(id vehicleId receivedAt callType status) do
      for invalid <- [
            Map.delete(data, field),
            Map.put(data, field, nil),
            Map.put(data, field, 123)
          ] do
        assert {:error, {:invalid_field, ^field}} = RttData.validate(invalid)
      end
    end
  end

  test "returns only the first validation error", %{data: data} do
    invalid =
      data
      |> Map.put("id", nil)
      |> Map.put("routeId", 123)
      |> Map.put("callType", "unknown")

    assert {:error, {:invalid_field, "id"}} = RttData.validate(invalid)
  end

  test "rejects unknown enum values", %{data: data} do
    for field <- ~w(callType status) do
      assert {:error, {:invalid_field, ^field}} =
               RttData.validate(Map.put(data, field, "unknown"))
    end
  end

  test "optional fields accept strings, nil, and reject other types", %{data: data} do
    for field <-
          ~w(talkGroup routeId routeName garage direction variant currentLocation operatorBadge operatorName runNumber adherence) do
      with_string = Map.put(data, field, "value")
      assert {:ok, ^with_string} = RttData.validate(with_string)
      with_nil = Map.put(data, field, nil)
      assert {:ok, ^with_nil} = RttData.validate(with_nil)

      for value <- [123, false, [], %{}] do
        assert {:error, {:invalid_field, ^field}} = RttData.validate(Map.put(data, field, value))
      end
    end
  end

  test "nullable response fields allow strings, null, or omission", %{data: data} do
    for field <- ~w(respondedBy answeredAt markedDoneAt) do
      for value <- ["value", nil] do
        call = Map.put(data, field, value)
        assert {:ok, ^call} = RttData.validate(call)
      end

      assert {:error, {:invalid_field, ^field}} = RttData.validate(Map.put(data, field, 123))
    end

    assert {:ok, ^data} = RttData.validate(data)
  end
end
