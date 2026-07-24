defmodule Skate.AlertsManager.Detours.ActiveDetour do
  @moduledoc """
  Active detour information for Alerts Manager.
  """

  defmodule RouteSegments do
    @moduledoc """
    Named mapping of detour route segments.
    """

    defmodule Point do
      @moduledoc """
      Point along a detour route segment.
      """
      use TypedEctoSchema
      import Ecto.Changeset

      @derive Jason.Encoder

      @primary_key false

      typed_embedded_schema do
        field(:lat, :float, enforce: true, null: false)
        field(:lon, :float, enforce: true, null: false)
      end

      def changeset(point, attrs \\ %{}) do
        point
        |> cast(attrs, [:lat, :lon])
        |> validate_required([:lat, :lon])
      end
    end

    use TypedEctoSchema
    import Ecto.Changeset

    @derive Jason.Encoder

    @primary_key false

    typed_embedded_schema do
      embeds_many :before_detour, Point
      embeds_many :after_detour, Point
      embeds_many :bypassed_segment, Point
      embeds_many :detour_segment, Point
    end

    def changeset(route_segments, attrs \\ %{}) do
      route_segments
      |> cast(attrs, [])
      |> cast_embed(:before_detour, with: &Point.changeset/2)
      |> cast_embed(:after_detour, with: &Point.changeset/2)
      |> cast_embed(:bypassed_segment, with: &Point.changeset/2)
      |> cast_embed(:detour_segment, with: &Point.changeset/2)
    end
  end

  use TypedEctoSchema
  import Ecto.Changeset

  @derive Jason.Encoder

  @primary_key false

  typed_embedded_schema do
    field :id, :integer
    field :route_id, :string
    field :reason, :string
    field :nearest_intersection, :string
    field :estimated_duration, :string
    field :activated_at, :integer
    field :updated_at, :integer
    field :direction_id, :integer
    field :missed_stops, {:array, :string}
    field :connection_points, {:array, :string}
    embeds_one :route_segments, RouteSegments
  end

  def changeset(detour, attrs \\ %{}) do
    detour
    |> cast(
      attrs,
      [
        :id,
        :route_id,
        :reason,
        :nearest_intersection,
        :estimated_duration,
        :activated_at,
        :updated_at,
        :direction_id,
        :missed_stops,
        :connection_points
      ],
      empty_values: [nil, ""]
    )
    |> validate_required([
      :id,
      :route_id,
      :reason,
      # :nearest_intersection
      :estimated_duration,
      :activated_at,
      :updated_at,
      :direction_id,
      :missed_stops,
      :connection_points
    ])
    |> validate_length(:connection_points, min: 1, max: 2)
    |> cast_embed(:route_segments, required: true, with: &RouteSegments.changeset/2)
  end
end
