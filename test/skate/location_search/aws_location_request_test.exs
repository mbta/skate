defmodule Skate.LocationSearch.AwsLocationRequestTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Skate.LocationSearch.AwsLocationRequest
  alias Skate.LocationSearch.Place
  alias Skate.LocationSearch.Suggestion

  setup do
    reassign_env(:skate, :aws_place_index, "test-index")
  end

  describe "get/1" do
    test "returns a place when found" do
      place = build(:amazon_location_place)

      response = %{
        status_code: 200,
        body: Jason.encode!(%{"Place" => place})
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/places/" <>
                                                     _place_id
                                               } ->
        {:ok, response}
      end)

      assert {:ok, %Place{}} = AwsLocationRequest.get("place_id")
    end

    test "returns errors" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/places/" <>
                                                     _place_id
                                               } ->
        {:error, "error"}
      end)

      assert {:error, "error"} = AwsLocationRequest.get("place_id")
    end
  end

  describe "search/1" do
    test "transforms result with name into Place structs" do
      name = "Some Landmark"
      address_number = "123"
      street = "Test St"
      address_suffix = "MA 02201, United States"

      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [
              build(:amazon_location_search_result, %{
                name: name,
                address_number: address_number,
                street: street,
                address_suffix: address_suffix
              })
            ]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path: "/places/v0/indexes/test-index/search/text"
                                               } ->
        {:ok, response}
      end)

      expected_address = "#{address_number} #{street}, #{address_suffix}"

      assert {:ok, [%Place{name: ^name, address: ^expected_address}]} =
               AwsLocationRequest.search("search text")
    end

    test "transforms result without name into Place structs" do
      address_number = "123"
      street = "Test St"
      address_suffix = "MA 02201, United States"

      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [
              build(:amazon_location_search_result, %{
                name: nil,
                address_number: address_number,
                street: street,
                address_suffix: address_suffix
              })
            ]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path: "/places/v0/indexes/test-index/search/text"
                                               } ->
        {:ok, response}
      end)

      expected_address = "#{address_number} #{street}, #{address_suffix}"

      assert {:ok, [%Place{name: nil, address: ^expected_address}]} =
               AwsLocationRequest.search("search text")
    end

    test "transforms result without address prefix information to go on into Place structs" do
      address_suffix = "Some Neighborhood, Boston, MA"

      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [
              build(:amazon_location_search_result, %{
                name: nil,
                address_number: nil,
                street: nil,
                address_suffix: address_suffix
              })
            ]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path: "/places/v0/indexes/test-index/search/text"
                                               } ->
        {:ok, response}
      end)

      assert {:ok, [%Place{name: nil, address: ^address_suffix}]} =
               AwsLocationRequest.search("search text")
    end

    test "returns errors" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path: "/places/v0/indexes/test-index/search/text"
                                               } ->
        {:error, "error"}
      end)

      assert {:error, "error"} = AwsLocationRequest.search("search text")
    end

    test "truncates search query to 200 chars" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 body: %{Text: text}
                                               } ->
        assert Kernel.byte_size(text) == 200
        {:error, "error"}
      end)

      assert {:error, "error"} = AwsLocationRequest.search(String.duplicate("search text", 200))
    end
  end

  describe "suggest/1" do
    test "pulls out suggested search text and place ID" do
      suggestion = build(:amazon_location_suggest_result, %{"Text" => "some place"})

      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [suggestion]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/search/suggestions"
                                               } ->
        {:ok, response}
      end)

      place_id = Map.get(suggestion, "PlaceId")

      assert {:ok, [%Suggestion{text: "some place", place_id: ^place_id}]} =
               AwsLocationRequest.suggest("text")
    end

    test "pulls out suggested search text when no place ID present" do
      suggestion =
        build(:amazon_location_suggest_result, %{"Text" => "some place", "PlaceId" => nil})

      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [suggestion]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/search/suggestions"
                                               } ->
        {:ok, response}
      end)

      assert {:ok, [%Suggestion{text: "some place", place_id: nil}]} =
               AwsLocationRequest.suggest("text")
    end

    test "returns errors" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/search/suggestions"
                                               } ->
        {:error, "error"}
      end)

      assert {:error, "error"} = AwsLocationRequest.suggest("search text")
    end

    test "truncates suggestion query to 200 chars" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 body: %{Text: text}
                                               } ->
        assert Kernel.byte_size(text) == 200
        {:error, "error"}
      end)

      assert {:error, "error"} = AwsLocationRequest.search(String.duplicate("search text", 200))
    end
  end
end
