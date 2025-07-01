defmodule Skate.BlockWaiversTest do
  use Skate.DataCase

  describe "create_block_waiver_notifications/1" do
    test "creates new notifications for waivers with recognized reason for vehicles on selected routes",
         %{user: user} do
      vehicle = @vehicle

      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [vehicle]
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          operator_name: vehicle.operator_last_name,
          operator_id: vehicle.operator_id,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "creates new notifications for waivers with recognized reason for ghosts on selected routes",
         %{user: user} do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        [@ghost]
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server,
          route_id_at_creation: "SL9001"
        )
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end

    test "creates new notifications for waivers with recognized reason when no vehicle or ghost is associated on selected routes",
         %{user: user} do
      reassign_env(:realtime, :peek_at_vehicles_by_run_ids_fn, fn _ ->
        []
      end)

      {:ok, server} = setup_server(user.id)

      for {cause_id, {cause_description, cause_atom}} <- @reasons_map do
        assert_block_waiver_notification(cause_atom, cause_description, cause_id, server)
      end

      assert_n_notifications_in_db(map_size(@reasons_map))
    end
  end
end
