defmodule Skate.LocationSearch.AwsLocationRequestTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Skate.LocationSearch.AwsLocationRequest
  alias Skate.LocationSearch.Place

  setup do
    reassign_env(:skate, :aws_place_index, "test-index")
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
  end

  describe "suggest/1" do
    test "pulls out suggested search text" do
      response = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [build(:amazon_location_suggest_result, %{"Text" => "some place"})]
          })
      }

      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/search/suggestions"
                                               } ->
        {:ok, response}
      end)

      assert {:ok, ["some place"]} = AwsLocationRequest.suggest("text")
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
  end
end
