defmodule Skate.LocationSearch.AwsLocationRequestTest do
  use ExUnit.Case

  import Skate.Factory
  import Test.Support.Helpers

  alias Skate.LocationSearch.AwsLocationRequest
  alias Skate.LocationSearch.SearchResult

  describe "search/1" do
    setup do
      reassign_env(:skate, :aws_place_index, "test-index")
    end

    test "makes Amazon Location Service request" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path: "/places/v0/indexes/test-index/search/text"
                                               } ->
        {:ok, %{status_code: 200}}
      end)

      assert {:ok, %{status_code: 200}} = AwsLocationRequest.search("search term")
    end
  end

  describe "suggest/1" do
    setup do
      reassign_env(:skate, :aws_place_index, "test-index")
    end

    test "makes Amazon Location Service request" do
      reassign_env(:skate, :aws_request_fn, fn %{
                                                 path:
                                                   "/places/v0/indexes/test-index/search/suggestions"
                                               } ->
        {:ok, %{status_code: 200}}
      end)

      assert {:ok, %{status_code: 200}} = AwsLocationRequest.suggest("search term")
    end
  end

  describe "parse_search_response/1" do
    test "transforms result with name into SearchResult structs" do
      name = "Some Landmark"
      address_number = "123"
      street = "Test St"
      address_suffix = "MA 02201, United States"

      reponse = %{
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

      expected_address = "#{address_number} #{street}, #{address_suffix}"

      assert [%SearchResult{name: ^name, address: ^expected_address}] =
               AwsLocationRequest.parse_search_response(reponse)
    end

    test "transforms result without name into SearchResult structs" do
      address_number = "123"
      street = "Test St"
      address_suffix = "MA 02201, United States"

      reponse = %{
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

      expected_address = "#{address_number} #{street}, #{address_suffix}"

      assert [%SearchResult{name: nil, address: ^expected_address}] =
               AwsLocationRequest.parse_search_response(reponse)
    end

    test "transforms result without address prefix information to go on into SearchResult structs" do
      address_suffix = "Some Neighborhood, Boston, MA"

      reponse = %{
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

      assert [%SearchResult{name: nil, address: ^address_suffix}] =
               AwsLocationRequest.parse_search_response(reponse)
    end
  end

  describe "parse_suggest_response/1" do
    test "pulls out suggested search text" do
      reponse = %{
        status_code: 200,
        body:
          Jason.encode!(%{
            "Results" => [build(:amazon_location_suggest_result, %{"Text" => "some place"})]
          })
      }

      assert ["some place"] = AwsLocationRequest.parse_suggest_response(reponse)
    end
  end
end
