defmodule Skate.StopShapeTestData do
  @moduledoc """
  Exported GTFS Shape and Stop data for testing
  """

  # GTFS Onboarding Query -- https://github.com/firestack/gtfs_onboarding.nix
  #
  # > SELECT FORMAT('{%s, %s},', shape_pt_lon, shape_pt_lat)
  # > FROM shapes
  # > WHERE shape_id = '710108'
  # > ORDER BY CAST(shape_pt_sequence as INTEGER)
  @route_71_shape_data [
    {-71.185563, 42.365445},
    {-71.185558, 42.365464},
    {-71.185544, 42.365561},
    {-71.185543, 42.365672},
    {-71.185487, 42.365738},
    {-71.185389, 42.365761},
    {-71.185201, 42.365769},
    {-71.184828, 42.365483},
    {-71.184339, 42.365211},
    {-71.183780, 42.365537},
    {-71.183780, 42.365537},
    {-71.183397, 42.365760},
    {-71.182922, 42.365954},
    {-71.182720, 42.366032},
    {-71.182231, 42.366204},
    {-71.181938, 42.366287},
    {-71.181741, 42.366359},
    {-71.181366, 42.366525},
    {-71.181219, 42.366604},
    {-71.181219, 42.366604},
    {-71.181118, 42.366659},
    {-71.180595, 42.366988},
    {-71.180056, 42.367326},
    {-71.179833, 42.367454},
    {-71.179367, 42.367682},
    {-71.179080, 42.367832},
    {-71.178771, 42.367977},
    {-71.178771, 42.367977},
    {-71.178667, 42.368026},
    {-71.178641, 42.368040},
    {-71.178442, 42.368119},
    {-71.178292, 42.368160},
    {-71.178091, 42.368205},
    {-71.177741, 42.368253},
    {-71.176962, 42.368338},
    {-71.176466, 42.368386},
    {-71.176283, 42.368407},
    {-71.176109, 42.368438},
    {-71.176109, 42.368438},
    {-71.175987, 42.368460},
    {-71.175664, 42.368519},
    {-71.175118, 42.368639},
    {-71.174875, 42.368699},
    {-71.174439, 42.368833},
    {-71.174176, 42.368950},
    {-71.174030, 42.369011},
    {-71.174030, 42.369011},
    {-71.173281, 42.369326},
    {-71.172597, 42.369593},
    {-71.172274, 42.369723},
    {-71.171985, 42.369826},
    {-71.171602, 42.369949},
    {-71.171469, 42.369985},
    {-71.171296, 42.370018},
    {-71.171126, 42.370042},
    {-71.170959, 42.370049},
    {-71.170801, 42.370047},
    {-71.170801, 42.370047},
    {-71.170603, 42.370044},
    {-71.170014, 42.370039},
    {-71.169099, 42.370023},
    {-71.168195, 42.370004},
    {-71.167517, 42.369994},
    {-71.167327, 42.369992},
    {-71.167327, 42.369992},
    {-71.166922, 42.369988},
    {-71.166738, 42.370005},
    {-71.166577, 42.370024},
    {-71.166432, 42.370053},
    {-71.166103, 42.370168},
    {-71.165919, 42.370246},
    {-71.165026, 42.370599},
    {-71.164842, 42.370664},
    {-71.164842, 42.370664},
    {-71.164665, 42.370726},
    {-71.164359, 42.370816},
    {-71.164091, 42.370857},
    {-71.163980, 42.370865},
    {-71.163752, 42.370868},
    {-71.163507, 42.370847},
    {-71.163224, 42.370801},
    {-71.162793, 42.370704},
    {-71.162421, 42.370633},
    {-71.161634, 42.370474},
    {-71.161485, 42.370448},
    {-71.161437, 42.370442},
    {-71.161437, 42.370442},
    {-71.160957, 42.370384},
    {-71.160428, 42.370326},
    {-71.160267, 42.370317},
    {-71.160012, 42.370324},
    {-71.159761, 42.370348},
    {-71.159516, 42.370385},
    {-71.159212, 42.370472},
    {-71.158927, 42.370597},
    {-71.158805, 42.370653},
    {-71.158433, 42.370903},
    {-71.158005, 42.371223},
    {-71.158005, 42.371223},
    {-71.157806, 42.371371},
    {-71.157599, 42.371533},
    {-71.157287, 42.371753},
    {-71.156757, 42.372032},
    {-71.156561, 42.372126},
    {-71.156140, 42.372307},
    {-71.155589, 42.372532},
    {-71.155004, 42.372783},
    {-71.155004, 42.372783},
    {-71.154882, 42.372836},
    {-71.154117, 42.373149},
    {-71.153643, 42.373333},
    {-71.153368, 42.373440},
    {-71.152918, 42.373617},
    {-71.152622, 42.373709},
    {-71.152147, 42.373868},
    {-71.151542, 42.374076},
    {-71.151388, 42.374125},
    {-71.151388, 42.374125},
    {-71.150374, 42.374448},
    {-71.150152, 42.374514},
    {-71.150069, 42.374536},
    {-71.149996, 42.374556},
    {-71.149686, 42.374647},
    {-71.149062, 42.374776},
    {-71.148016, 42.374955},
    {-71.147905, 42.374970},
    {-71.147905, 42.374970},
    {-71.147067, 42.375086},
    {-71.146495, 42.375161},
    {-71.145928, 42.375242},
    {-71.145715, 42.375256},
    {-71.145447, 42.375300},
    {-71.145218, 42.375289},
    {-71.145072, 42.375308},
    {-71.144702, 42.375305},
    {-71.144530, 42.375331},
    {-71.143790, 42.375356},
    {-71.143339, 42.375370},
    {-71.142972, 42.375377},
    {-71.142972, 42.375377},
    {-71.142922, 42.375378},
    {-71.142545, 42.375354},
    {-71.141976, 42.375281},
    {-71.140544, 42.375044},
    {-71.139955, 42.374953},
    {-71.139955, 42.374953},
    {-71.139718, 42.374916},
    {-71.139284, 42.374861},
    {-71.138937, 42.374817},
    {-71.138511, 42.374773},
    {-71.138059, 42.374836},
    {-71.137862, 42.374868},
    {-71.137234, 42.374983},
    {-71.137116, 42.375006},
    {-71.136838, 42.375043},
    {-71.136552, 42.375044},
    {-71.136552, 42.375044},
    {-71.136438, 42.375044},
    {-71.135274, 42.374977},
    {-71.134790, 42.374944},
    {-71.134211, 42.374911},
    {-71.133781, 42.374885},
    {-71.133781, 42.374885},
    {-71.133058, 42.374842},
    {-71.132590, 42.374814},
    {-71.132125, 42.374792},
    {-71.131578, 42.374754},
    {-71.131170, 42.374725},
    {-71.130704, 42.374699},
    {-71.130704, 42.374699},
    {-71.130580, 42.374692},
    {-71.128434, 42.374553},
    {-71.127834, 42.374524},
    {-71.126425, 42.374421},
    {-71.125940, 42.374384},
    {-71.125453, 42.374267},
    {-71.124905, 42.374063},
    {-71.124724, 42.373997},
    {-71.124724, 42.373997},
    {-71.124379, 42.373870},
    {-71.124131, 42.373784},
    {-71.124060, 42.373753},
    {-71.123776, 42.373651},
    {-71.123448, 42.373535},
    {-71.122919, 42.373331},
    {-71.122533, 42.373190},
    {-71.122358, 42.373125},
    {-71.122358, 42.373125},
    {-71.122210, 42.373071},
    {-71.122088, 42.373169},
    {-71.121947, 42.373258},
    {-71.121686, 42.373341},
    {-71.121378, 42.373360},
    {-71.121124, 42.373389},
    {-71.120870, 42.373383},
    {-71.120650, 42.373402},
    {-71.120349, 42.373436},
    {-71.120042, 42.373479},
    {-71.119734, 42.373528},
    {-71.119540, 42.373577},
    {-71.119372, 42.373666},
    {-71.119191, 42.373843},
    {-71.119089, 42.374041},
    {-71.119008, 42.374259},
    {-71.119002, 42.374281},
    {-71.119002, 42.374281},
    {-71.118967, 42.374422},
    {-71.118945, 42.374635},
    {-71.118937, 42.374863},
    {-71.118943, 42.375002},
    {-71.118956, 42.375145},
    {-71.118962, 42.375255},
    {-71.119005, 42.375683},
    {-71.119041, 42.375880},
    {-71.119070, 42.375996},
    {-71.119103, 42.376080},
    {-71.119159, 42.376144},
    {-71.119245, 42.376205},
    {-71.119398, 42.376275},
    {-71.119479, 42.376337},
    {-71.119584, 42.376268},
    {-71.119619, 42.376235},
    {-71.119387, 42.375747},
    {-71.119246, 42.375481},
    {-71.119142, 42.375138},
    {-71.118896, 42.374533},
    {-71.118823, 42.374341},
    {-71.118841, 42.374255},
    {-71.118894, 42.374064},
    {-71.118932, 42.373976},
    {-71.118979, 42.373910},
    {-71.119099, 42.373714},
    {-71.119268, 42.373539},
    {-71.119485, 42.373444},
    {-71.119780, 42.373372},
    {-71.119908, 42.373353},
    {-71.120388, 42.373278},
    {-71.120781, 42.373172},
    {-71.121093, 42.373055},
    {-71.121262, 42.372971},
    {-71.121436, 42.372838},
    {-71.121575, 42.372640},
    {-71.121682, 42.372494}
  ]

  @route_71_stops_data [
    %Schedule.Gtfs.Stop{
      id: "8178",
      name: "Watertown Sq Terminal",
      latitude: 42.365436,
      longitude: -71.185502
    },
    %Schedule.Gtfs.Stop{
      id: "2048",
      name: "Mt Auburn St @ Main St",
      latitude: 42.365489,
      longitude: -71.183729
    },
    %Schedule.Gtfs.Stop{
      id: "2049",
      name: "Mt Auburn St @ Patten St",
      latitude: 42.366566,
      longitude: -71.181182
    },
    %Schedule.Gtfs.Stop{
      id: "2050",
      name: "Mt Auburn St @ Parker St",
      latitude: 42.367937,
      longitude: -71.178736
    },
    %Schedule.Gtfs.Stop{
      id: "2051",
      name: "Mt Auburn St @ Franklin St",
      latitude: 42.368385,
      longitude: -71.176092
    },
    %Schedule.Gtfs.Stop{
      id: "2052",
      name: "Mt Auburn St @ Walnut St",
      latitude: 42.368947,
      longitude: -71.173980
    },
    %Schedule.Gtfs.Stop{
      id: "2054",
      name: "Mt Auburn St @ Boylston St",
      latitude: 42.369970,
      longitude: -71.170803
    },
    %Schedule.Gtfs.Stop{
      id: "2056",
      name: "Mt Auburn St @ Winthrop St",
      latitude: 42.369923,
      longitude: -71.167329
    },
    %Schedule.Gtfs.Stop{
      id: "2057",
      name: "Mt Auburn St @ School St",
      latitude: 42.370622,
      longitude: -71.164816
    },
    %Schedule.Gtfs.Stop{
      id: "2058",
      name: "Mt Auburn St @ Adams St",
      latitude: 42.370401,
      longitude: -71.161446
    },
    %Schedule.Gtfs.Stop{
      id: "2060",
      name: "Mt Auburn St @ Bigelow Ave",
      latitude: 42.371186,
      longitude: -71.157955
    },
    %Schedule.Gtfs.Stop{
      id: "2061",
      name: "Mt Auburn St opp Keenan St",
      latitude: 42.372730,
      longitude: -71.154963
    },
    %Schedule.Gtfs.Stop{
      id: "2062",
      name: "Mt Auburn St @ Cottage St",
      latitude: 42.374061,
      longitude: -71.151351
    },
    %Schedule.Gtfs.Stop{
      id: "2064",
      name: "Mt Auburn St opp Homer Ave",
      latitude: 42.374908,
      longitude: -71.147889
    },
    %Schedule.Gtfs.Stop{
      id: "2066",
      name: "Mt Auburn St opp Brattle St",
      latitude: 42.375348,
      longitude: -71.142971
    },
    %Schedule.Gtfs.Stop{
      id: "2067",
      name: "Mt Auburn St @ Coolidge Ave",
      latitude: 42.374897,
      longitude: -71.139970
    },
    %Schedule.Gtfs.Stop{
      id: "2068",
      name: "Mt Auburn St opp Traill St",
      latitude: 42.374987,
      longitude: -71.136551
    },
    %Schedule.Gtfs.Stop{
      id: "2070",
      name: "Mt Auburn St @ Mt Auburn Hospital",
      latitude: 42.374842,
      longitude: -71.133786
    },
    %Schedule.Gtfs.Stop{
      id: "2071",
      name: "Mt Auburn St opp Sparks St",
      latitude: 42.374625,
      longitude: -71.130712
    },
    %Schedule.Gtfs.Stop{
      id: "2073",
      name: "Mt Auburn St @ Brewer St",
      latitude: 42.373956,
      longitude: -71.124752
    },
    %Schedule.Gtfs.Stop{
      id: "2074",
      name: "Mt Auburn St @ University Rd",
      latitude: 42.373051,
      longitude: -71.122407
    },
    %Schedule.Gtfs.Stop{id: "20761", name: "Harvard", latitude: 42.374217, longitude: -71.118970}
  ]

  def route_71_shape_points(),
    do: Enum.map(@route_71_shape_data, fn {long, lat} -> Util.Location.new(lat, long) end)

  def route_71_stops(), do: @route_71_stops_data
end
