-- =============================================================================
-- OpenDive Atlas — seed dataset
--
-- Idempotent: safe to run multiple times (upserts by slug).
-- Coordinates are approximate mooring/entry points for orientation only —
-- always confirm entry points with a local operator before diving.
--
-- Photos reference Wikimedia Commons via Special:FilePath. Run
-- `npm run seed:verify-photos` to check each file and print author/license
-- updates for the photos table.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Dive sites
-- -----------------------------------------------------------------------------
insert into public.dive_sites (
  slug, name, country, region, latitude, longitude, dive_types, experience_level,
  visibility_min_m, visibility_max_m, temp_min_c, temp_max_c, max_depth_m,
  typical_current, description, access_notes
) values
(
  'blue-heron-bridge', 'Blue Heron Bridge', 'United States', 'Florida — Palm Beach County',
  26.7837, -80.0432, '{shore,muck,reef}', 'beginner',
  3, 15, 22, 29, 6,
  'moderate',
  'A shallow shore dive under the Blue Heron Bridge in Phil Foster Park, Riviera Beach, widely regarded as one of the best macro and muck dives in North America. The sand, rubble and bridge pilings hide frogfish, seahorses, octopus, batfish, nudibranchs and juvenile reef fish, and a snorkel trail of artificial reef modules runs east of the bridge. Rarely deeper than 6 m, it is ideal for long, slow dives and new divers.',
  'Dive within roughly an hour either side of high slack tide — tidal flow is strong at other times. Stay inside the dive flag area and away from the boat channel. Park opening hours and parking rules apply.'
),
(
  'molasses-reef', 'Molasses Reef', 'United States', 'Florida — Key Largo',
  25.0100, -80.3750, '{reef,boat}', 'beginner',
  10, 30, 22, 30, 12,
  'moderate',
  'A classic spur-and-groove reef inside the Florida Keys National Marine Sanctuary and one of the most visited reefs in the Keys. Coral ridges rise from sand channels in 3–12 m of water and shelter large schools of grunts and snapper, moray eels, nurse sharks, sea turtles and colourful angelfish. Mooring buoys protect the reef and make for easy, shallow boat dives.',
  'Use the sanctuary mooring buoys — anchoring on the reef is prohibited. Currents can pick up along the outer edge; plan dives with your operator.'
),
(
  'uss-oriskany', 'USS Oriskany', 'United States', 'Florida — Pensacola (Gulf of Mexico)',
  30.0425, -87.0064, '{wreck,boat}', 'advanced',
  10, 30, 18, 29, 65,
  'moderate',
  'The aircraft carrier USS Oriskany ("The Mighty O") was scuttled in 2006 about 22 nautical miles south-east of Pensacola, creating the largest artificial reef ever intentionally sunk. The island superstructure tops out around 25 m, the flight deck lies near 44 m and the hull rests on sand at roughly 65 m. Huge schools of amberjack, red snapper and barracuda patrol the structure.',
  'Offshore boat dive with exposure to Gulf currents and swell. The flight deck and below are deep technical territory — plan gas, decompression and penetration limits accordingly.'
),
(
  'salt-pier', 'Salt Pier', 'Bonaire', 'Bonaire — South of Kralendijk',
  12.0846, -68.2826, '{shore,reef}', 'beginner',
  15, 30, 26, 29, 17,
  'mild',
  'The pilings of Bonaire''s working salt-loading pier are encrusted with sponges and corals and act as a magnet for marine life. Divers weave between the columns among schools of goatfish, grunts and snapper, with tarpon hanging in the shade and frogfish, octopus and hawksbill turtles often found nearby. Light shafts filtering through the structure make it a favourite for wide-angle photographers.',
  'Diving is only permitted when no ship is docked. Check with the Bonaire National Marine Park or your dive shop on the day, and obey any instruction from pier staff. A Bonaire nature fee tag is required.'
),
(
  'hilma-hooker', 'Hilma Hooker', 'Bonaire', 'Bonaire — South of Kralendijk',
  12.1036, -68.2881, '{wreck,shore}', 'intermediate',
  15, 30, 26, 29, 30,
  'mild',
  'A 72 m cargo ship that sank in 1984 after being impounded during a drug investigation, now lying on her starboard side in about 30 m of water between two reefs. Her hull is colonised by corals and sponges, and tarpon, barracuda and groupers are frequent visitors. The wreck sits close enough to shore to be dived from the beach.',
  'Shore entry from the marked yellow stone. The top of the wreck is around 18 m and the sand around 30 m, so monitor depth and no-stop limits. Penetration is not recommended.'
),
(
  'palancar-reef', 'Palancar Reef', 'Mexico', 'Quintana Roo — Cozumel',
  20.3328, -87.0273, '{reef,wall,boat,drift}', 'intermediate',
  20, 40, 25, 29, 40,
  'moderate',
  'Palancar is a sprawling reef system inside the Cozumel Reefs National Park, famed for towering coral pinnacles, swim-throughs and caves. Sites such as Palancar Gardens, Horseshoe and Caves offer drifts along massive buttresses with exceptional visibility. Look for the endemic splendid toadfish, hawksbill turtles, nurse sharks and spotted eagle rays.',
  'Drift dives from boats only; currents can be brisk. A national park fee applies. Gloves and touching the reef are prohibited.'
),
(
  'santa-rosa-wall', 'Santa Rosa Wall', 'Mexico', 'Quintana Roo — Cozumel',
  20.3786, -87.0256, '{wall,reef,boat,drift}', 'advanced',
  25, 40, 25, 29, 40,
  'strong',
  'A dramatic vertical wall that drops into the deep blue, riddled with overhangs, tunnels and sponge-covered ledges. Strong drifts carry divers past huge barrel sponges, black coral, groupers, spiny lobsters and turtles, with eagle rays often cruising out in the blue. One of Cozumel''s signature advanced dives.',
  'Fast drift along a deep wall — buoyancy control and depth awareness are essential. Stay with your guide and carry a surface marker buoy.'
),
(
  'molokini-crater', 'Molokini Crater', 'United States', 'Hawaii — Maui',
  20.6328, -156.4964, '{reef,wall,boat}', 'beginner',
  25, 45, 23, 27, 40,
  'mild',
  'A crescent-shaped volcanic crater about 4 km off Maui and a Marine Life Conservation District. Inside the crater, calm, clear water over coral gardens suits new divers, with Moorish idols, reef triggerfish, yellow tangs and green sea turtles. The Back Wall on the outer side drops steeply and is reserved for experienced divers due to currents and depth.',
  'Boat access only, usually in the morning before the trade winds pick up. The Back Wall is an advanced drift dive. Do not stand on or touch coral.'
),
(
  'cod-hole', 'Cod Hole', 'Australia', 'Queensland — Ribbon Reefs, Great Barrier Reef',
  -14.6697, 145.6497, '{reef,boat}', 'beginner',
  15, 30, 23, 29, 25,
  'mild',
  'Located at the northern end of Ribbon Reef No. 10, the Cod Hole is world-famous for its resident potato cod — large, curious groupers that approach divers closely. Humphead (Maori) wrasse, giant clams, moray eels and reef sharks complete the picture on a relaxed, shallow reef dive.',
  'Reached by liveaboard from Cairns or Port Douglas. Feeding fish is not permitted; keep a respectful distance from the cod.'
),
(
  'osprey-reef', 'Osprey Reef', 'Australia', 'Coral Sea Marine Park',
  -13.8900, 146.5500, '{reef,wall,boat}', 'advanced',
  30, 50, 24, 29, 40,
  'moderate',
  'An isolated oceanic reef rising from depths of over 1,000 m in the Coral Sea, some 350 km north-east of Cairns. Its walls are washed by clear oceanic water and are renowned for shark encounters at North Horn, where grey reef, whitetip and silvertip sharks gather. Manta rays and dogtooth tuna are also seen.',
  'Remote liveaboard destination exposed to open-ocean conditions. Walls drop far beyond recreational limits — strict depth discipline is essential.'
)
on conflict (slug) do update set
  name = excluded.name, country = excluded.country, region = excluded.region,
  latitude = excluded.latitude, longitude = excluded.longitude,
  dive_types = excluded.dive_types, experience_level = excluded.experience_level,
  visibility_min_m = excluded.visibility_min_m, visibility_max_m = excluded.visibility_max_m,
  temp_min_c = excluded.temp_min_c, temp_max_c = excluded.temp_max_c,
  max_depth_m = excluded.max_depth_m, typical_current = excluded.typical_current,
  description = excluded.description, access_notes = excluded.access_notes;

-- -----------------------------------------------------------------------------
-- Species
-- -----------------------------------------------------------------------------
insert into public.species (slug, common_name, scientific_name, category, iucn_status, description) values
('queen-angelfish', 'Queen Angelfish', 'Holacanthus ciliaris', 'fish', 'LC',
 'A brilliantly coloured Caribbean angelfish with electric blue and yellow scales and a distinctive dark "crown" spot on the forehead. Usually seen in pairs grazing on sponges around reefs.'),
('french-angelfish', 'French Angelfish', 'Pomacanthus paru', 'fish', 'LC',
 'A large, black angelfish whose scales are edged in gold. French angelfish are curious and often approach divers, typically travelling in pairs.'),
('blue-tang', 'Atlantic Blue Tang', 'Acanthurus coeruleus', 'fish', 'LC',
 'A surgeonfish that is yellow as a juvenile and deep blue as an adult. Forms large grazing schools over Caribbean reefs, feeding on algae.'),
('atlantic-tarpon', 'Atlantic Tarpon', 'Megalops atlanticus', 'fish', 'VU',
 'A large silver fish with huge scales that can exceed 2 m in length. Tarpon often hover in shaded areas under piers and around wrecks, and can gulp air at the surface.'),
('great-barracuda', 'Great Barracuda', 'Sphyraena barracuda', 'fish', 'LC',
 'A long, torpedo-shaped predator with prominent teeth, common around reefs and wrecks worldwide in warm water. Often hangs motionless near divers out of curiosity.'),
('goliath-grouper', 'Atlantic Goliath Grouper', 'Epinephelus itajara', 'fish', 'VU',
 'The largest grouper in the Atlantic, reaching over 2 m and 350 kg. Protected in US waters, goliath groupers aggregate on Florida wrecks and ledges to spawn in late summer.'),
('red-snapper', 'Northern Red Snapper', 'Lutjanus campechanus', 'fish', 'VU',
 'A rosy-red snapper that schools around offshore structure in the Gulf of Mexico and western Atlantic, including artificial reefs and wrecks.'),
('greater-amberjack', 'Greater Amberjack', 'Seriola dumerili', 'fish', 'LC',
 'A powerful, silvery jack with a dark stripe through the eye. Large schools circle offshore wrecks and pinnacles, often swimming right past divers.'),
('longlure-frogfish', 'Longlure Frogfish', 'Antennarius multiocellatus', 'fish', 'LC',
 'A master of camouflage that matches sponges in colour and texture. Frogfish use a modified dorsal spine as a fishing lure to attract prey, then strike in a fraction of a second.'),
('splendid-toadfish', 'Splendid Toadfish', 'Sanopus splendidus', 'fish', 'NT',
 'Endemic to Cozumel, this striking toadfish has bright yellow fins and a striped head. It hides under ledges and is usually seen only as a head peeking out of a crevice.'),
('lined-seahorse', 'Lined Seahorse', 'Hippocampus erectus', 'fish', 'VU',
 'A seahorse of the western Atlantic found in seagrass and around shallow structure, gripping holdfasts with its prehensile tail. Males brood the young in a pouch.'),
('potato-cod', 'Potato Cod', 'Epinephelus tukula', 'fish', 'LC',
 'A large grouper with dark, potato-shaped blotches on a pale body, reaching about 2 m. Famously approachable at the Cod Hole on the Great Barrier Reef.'),
('humphead-wrasse', 'Humphead Wrasse', 'Cheilinus undulatus', 'fish', 'EN',
 'Also called the Maori or Napoleon wrasse, this is one of the largest reef fish, with a prominent hump on its forehead and thick lips. Endangered due to overfishing for the live reef fish trade.'),
('moorish-idol', 'Moorish Idol', 'Zanclus cornutus', 'fish', 'LC',
 'An instantly recognisable Indo-Pacific reef fish with bold black, white and yellow bands and a long, trailing dorsal fin.'),
('reef-triggerfish', 'Reef Triggerfish', 'Rhinecanthus rectangulus', 'fish', 'LC',
 'Known in Hawaii as humuhumunukunukuapua''a, the state fish. It has a wedge-shaped dark band and can lock its dorsal spine upright to wedge itself into crevices.'),
('yellow-tang', 'Yellow Tang', 'Zebrasoma flavescens', 'fish', 'LC',
 'A bright yellow surgeonfish abundant on Hawaiian reefs, grazing algae in loose groups.'),
('green-moray', 'Green Moray', 'Gymnothorax funebris', 'fish', 'LC',
 'A large Atlantic moray eel whose green colour comes from a yellow mucus over a dark blue skin. Usually seen with its head out of a reef crevice, rhythmically opening its mouth to breathe.'),
('dogtooth-tuna', 'Dogtooth Tuna', 'Gymnosarda unicolor', 'fish', 'LC',
 'A large pelagic tuna of the Indo-Pacific that patrols steep reef walls and channels, often seen hunting along oceanic reefs.'),
('nurse-shark', 'Nurse Shark', 'Ginglymostoma cirratum', 'shark_ray', 'VU',
 'A docile bottom-dwelling shark often found resting under ledges during the day. Uses suction to feed on crustaceans, molluscs and fish.'),
('whitetip-reef-shark', 'Whitetip Reef Shark', 'Triaenodon obesus', 'shark_ray', 'VU',
 'A slender reef shark with bright white tips on its dorsal and tail fins. Rests in caves by day and hunts in reef crevices at night.'),
('grey-reef-shark', 'Grey Reef Shark', 'Carcharhinus amblyrhynchos', 'shark_ray', 'EN',
 'A common Indo-Pacific reef shark with a black trailing edge on its tail. Often gathers in groups near current-swept reef points such as North Horn.'),
('spotted-eagle-ray', 'Spotted Eagle Ray', 'Aetobatus narinari', 'shark_ray', 'EN',
 'An elegant ray with a dark back covered in white spots and a long whip-like tail. Often seen gliding in the blue or digging for molluscs in the sand.'),
('reef-manta-ray', 'Reef Manta Ray', 'Mobula alfredi', 'shark_ray', 'VU',
 'A huge filter-feeding ray with a wingspan of up to 5 m, frequenting cleaning stations on coastal and oceanic reefs.'),
('hawksbill-turtle', 'Hawksbill Sea Turtle', 'Eretmochelys imbricata', 'reptile', 'CR',
 'A critically endangered sea turtle with a narrow, pointed beak and overlapping shell plates. Feeds mainly on sponges and is a frequent reef companion in the Caribbean.'),
('green-sea-turtle', 'Green Sea Turtle', 'Chelonia mydas', 'reptile', 'EN',
 'A large herbivorous sea turtle named for the greenish colour of its fat. In Hawaii it is called honu and is often seen resting on reefs or visiting cleaning stations.'),
('loggerhead-turtle', 'Loggerhead Sea Turtle', 'Caretta caretta', 'reptile', 'VU',
 'A sea turtle with a large head and powerful jaws for crushing crabs and conchs. Florida hosts one of the largest loggerhead nesting populations in the world.'),
('west-indian-manatee', 'West Indian Manatee', 'Trichechus manatus', 'mammal', 'VU',
 'A gentle, slow-moving marine mammal that grazes seagrass. Manatees occasionally visit shallow Florida dive sites, especially in cooler months — never chase or touch them.'),
('caribbean-reef-octopus', 'Caribbean Reef Octopus', 'Octopus briareus', 'cephalopod', 'LC',
 'A nocturnal octopus with blue-green iridescent skin that can change colour in an instant. Hunts crabs and shrimps at night on reefs and rubble.'),
('caribbean-spiny-lobster', 'Caribbean Spiny Lobster', 'Panulirus argus', 'crustacean', 'DD',
 'A clawless lobster with long spiny antennae, often seen in groups under ledges with antennae waving out of crevices.'),
('giant-clam', 'Giant Clam', 'Tridacna gigas', 'mollusc', 'CR',
 'The largest living bivalve, which can exceed 1 m across and 200 kg. Its colourful mantle hosts photosynthetic algae that provide most of its food.'),
('elkhorn-coral', 'Elkhorn Coral', 'Acropora palmata', 'coral', 'CR',
 'A branching reef-building coral with broad, flattened branches resembling elk antlers. Once dominant in shallow Caribbean reefs, it has declined dramatically and is critically endangered.'),
('grooved-brain-coral', 'Grooved Brain Coral', 'Diploria labyrinthiformis', 'coral', 'CR',
 'A massive dome-shaped coral whose surface of meandering ridges and valleys resembles a brain. Common on Caribbean reefs but threatened by stony coral tissue loss disease.'),
('longspine-squirrelfish', 'Long-spined Squirrelfish', 'Holocentrus rufus', 'fish', 'LC',
 'A red-and-silver striped reef fish with oversized eyes and a tall dorsal fin whose spines carry white tips. Squirrelfish are nocturnal: by day they hover in holes and under ledges on the reef wall, and at night they come out to hunt crabs and shrimps. They make clicking and grunting sounds when disturbed.')
on conflict (slug) do update set
  common_name = excluded.common_name, scientific_name = excluded.scientific_name,
  category = excluded.category, iucn_status = excluded.iucn_status,
  description = excluded.description;

-- -----------------------------------------------------------------------------
-- Site <-> species ("commonly sighted here")
-- -----------------------------------------------------------------------------
insert into public.site_species (site_id, species_id, frequency, notes)
select ds.id, sp.id, v.frequency::public.sighting_frequency, v.notes
from (values
  -- Blue Heron Bridge
  ('blue-heron-bridge', 'longlure-frogfish',       'common',     'Look on sponges near the pilings and rubble.'),
  ('blue-heron-bridge', 'lined-seahorse',          'occasional', 'Seagrass and around the snorkel trail modules.'),
  ('blue-heron-bridge', 'caribbean-reef-octopus',  'common',     null),
  ('blue-heron-bridge', 'spotted-eagle-ray',       'occasional', null),
  ('blue-heron-bridge', 'west-indian-manatee',     'rare',       'Mostly in cooler months.'),
  ('blue-heron-bridge', 'green-moray',             'occasional', null),
  -- Molasses Reef
  ('molasses-reef', 'queen-angelfish',         'common',   null),
  ('molasses-reef', 'french-angelfish',        'common',   null),
  ('molasses-reef', 'blue-tang',               'abundant', null),
  ('molasses-reef', 'green-moray',             'common',   null),
  ('molasses-reef', 'nurse-shark',             'common',   null),
  ('molasses-reef', 'loggerhead-turtle',       'occasional', null),
  ('molasses-reef', 'elkhorn-coral',           'occasional', 'Restoration outplants in the shallows.'),
  ('molasses-reef', 'grooved-brain-coral',     'common',   null),
  ('molasses-reef', 'caribbean-spiny-lobster', 'common',   null),
  -- USS Oriskany
  ('uss-oriskany', 'greater-amberjack', 'abundant',   'Large schools around the island.'),
  ('uss-oriskany', 'red-snapper',       'abundant',   null),
  ('uss-oriskany', 'great-barracuda',   'common',     null),
  ('uss-oriskany', 'goliath-grouper',   'occasional', null),
  ('uss-oriskany', 'spotted-eagle-ray', 'rare',       null),
  -- Salt Pier
  ('salt-pier', 'atlantic-tarpon',        'common',     'Hanging in the shade of the pilings.'),
  ('salt-pier', 'hawksbill-turtle',       'occasional', null),
  ('salt-pier', 'longlure-frogfish',      'occasional', null),
  ('salt-pier', 'french-angelfish',       'common',     null),
  ('salt-pier', 'caribbean-reef-octopus', 'occasional', null),
  ('salt-pier', 'great-barracuda',        'common',     null),
  -- Hilma Hooker
  ('hilma-hooker', 'atlantic-tarpon',   'common',     null),
  ('hilma-hooker', 'great-barracuda',   'common',     null),
  ('hilma-hooker', 'hawksbill-turtle',  'occasional', null),
  ('hilma-hooker', 'green-moray',       'occasional', null),
  ('hilma-hooker', 'queen-angelfish',   'common',     null),
  -- Palancar Reef
  ('palancar-reef', 'splendid-toadfish', 'common',     'Listen for its grunting call under ledges.'),
  ('palancar-reef', 'hawksbill-turtle',  'common',     null),
  ('palancar-reef', 'nurse-shark',       'common',     null),
  ('palancar-reef', 'spotted-eagle-ray', 'occasional', null),
  ('palancar-reef', 'queen-angelfish',   'common',     null),
  ('palancar-reef', 'great-barracuda',   'occasional', null),
  -- Santa Rosa Wall
  ('santa-rosa-wall', 'spotted-eagle-ray',       'occasional', 'Look out into the blue.'),
  ('santa-rosa-wall', 'hawksbill-turtle',        'common',     null),
  ('santa-rosa-wall', 'splendid-toadfish',       'occasional', null),
  ('santa-rosa-wall', 'caribbean-spiny-lobster', 'common',     null),
  ('santa-rosa-wall', 'green-moray',             'common',     null),
  -- Molokini Crater
  ('molokini-crater', 'moorish-idol',        'common',     null),
  ('molokini-crater', 'reef-triggerfish',    'common',     null),
  ('molokini-crater', 'yellow-tang',         'abundant',   null),
  ('molokini-crater', 'green-sea-turtle',    'common',     null),
  ('molokini-crater', 'whitetip-reef-shark', 'occasional', 'More likely on the Back Wall.'),
  ('molokini-crater', 'reef-manta-ray',      'rare',       null),
  -- Cod Hole
  ('cod-hole', 'potato-cod',          'abundant',   'Resident and very approachable.'),
  ('cod-hole', 'humphead-wrasse',     'common',     null),
  ('cod-hole', 'giant-clam',          'common',     null),
  ('cod-hole', 'whitetip-reef-shark', 'occasional', null),
  ('cod-hole', 'moorish-idol',        'common',     null),
  -- Osprey Reef
  ('osprey-reef', 'grey-reef-shark',     'abundant',   'North Horn.'),
  ('osprey-reef', 'whitetip-reef-shark', 'common',     null),
  ('osprey-reef', 'dogtooth-tuna',       'common',     null),
  ('osprey-reef', 'reef-manta-ray',      'occasional', null),
  ('osprey-reef', 'humphead-wrasse',     'occasional', null),
  ('osprey-reef', 'potato-cod',          'occasional', null),
  -- Long-spined squirrelfish (Caribbean)
  ('salt-pier',       'longspine-squirrelfish', 'common', 'Hovering in the shade between pilings.'),
  ('hilma-hooker',    'longspine-squirrelfish', 'common', 'In the wreck''s openings and overhangs.'),
  ('molasses-reef',   'longspine-squirrelfish', 'common', 'Under ledges along the spurs.'),
  ('palancar-reef',   'longspine-squirrelfish', 'common', 'In holes and swim-throughs.'),
  ('santa-rosa-wall', 'longspine-squirrelfish', 'common', 'Look into the wall''s holes and overhangs.')
) as v(site_slug, species_slug, frequency, notes)
join public.dive_sites ds on ds.slug = v.site_slug
join public.species sp on sp.slug = v.species_slug
on conflict (site_id, species_id) do update set
  frequency = excluded.frequency, notes = excluded.notes;

-- -----------------------------------------------------------------------------
-- Photos (Wikimedia Commons). External URLs are only insertable by admins or
-- trusted contexts (this seed). Rows are keyed by external_url for idempotency.
-- -----------------------------------------------------------------------------
insert into public.photos (external_url, species_id, caption, attribution, license, source_url)
select
  'https://commons.wikimedia.org/wiki/Special:FilePath/' || replace(v.file, ' ', '_') || '?width=1280',
  sp.id,
  v.caption,
  'Wikimedia Commons contributors',
  'See source',
  'https://commons.wikimedia.org/wiki/File:' || replace(v.file, ' ', '_')
from (values
  ('queen-angelfish',         'Holacanthus ciliaris 1.jpg',               'Queen angelfish'),
  ('french-angelfish',        'Pomacanthus paru 1.jpg',                   'French angelfish'),
  ('blue-tang',               'Acanthurus coeruleus.jpg',                 'Blue tang'),
  ('atlantic-tarpon',         'Megalops atlanticus.jpg',                  'Atlantic tarpon'),
  ('great-barracuda',         'Sphyraena barracuda.jpg',                  'Great barracuda'),
  ('goliath-grouper',         'Epinephelus itajara.jpg',                  'Goliath grouper'),
  ('red-snapper',             'Lutjanus campechanus.jpg',                 'Red snapper'),
  ('greater-amberjack',       'Seriola dumerili.jpg',                     'Greater amberjack'),
  ('longlure-frogfish',       'Antennarius multiocellatus.jpg',           'Longlure frogfish'),
  ('splendid-toadfish',       'Sanopus splendidus.jpg',                   'Splendid toadfish'),
  ('lined-seahorse',          'Hippocampus erectus.jpg',                  'Lined seahorse'),
  ('potato-cod',              'Epinephelus tukula.jpg',                   'Potato cod'),
  ('humphead-wrasse',         'Cheilinus undulatus.jpg',                  'Humphead wrasse'),
  ('moorish-idol',            'Zanclus cornutus.jpg',                     'Moorish idol'),
  ('reef-triggerfish',        'Rhinecanthus rectangulus.jpg',             'Reef triggerfish'),
  ('yellow-tang',             'Zebrasoma flavescens.jpg',                 'Yellow tang'),
  ('green-moray',             'Gymnothorax funebris.jpg',                 'Green moray'),
  ('dogtooth-tuna',           'Gymnosarda unicolor.jpg',                  'Dogtooth tuna'),
  ('nurse-shark',             'Ginglymostoma cirratum.jpg',               'Nurse shark'),
  ('whitetip-reef-shark',     'Triaenodon obesus.jpg',                    'Whitetip reef shark'),
  ('grey-reef-shark',         'Carcharhinus amblyrhynchos.jpg',           'Grey reef shark'),
  ('spotted-eagle-ray',       'Aetobatus narinari.jpg',                   'Spotted eagle ray'),
  ('reef-manta-ray',          'Mobula alfredi.jpg',                       'Reef manta ray'),
  ('hawksbill-turtle',        'Eretmochelys imbricata.jpg',               'Hawksbill sea turtle'),
  ('green-sea-turtle',        'Chelonia mydas is going for the air.jpg',  'Green sea turtle surfacing'),
  ('loggerhead-turtle',       'Caretta caretta.jpg',                      'Loggerhead sea turtle'),
  ('west-indian-manatee',     'FL fig04.jpg',                             'West Indian manatee'),
  ('caribbean-reef-octopus',  'Octopus briareus.jpg',                     'Caribbean reef octopus'),
  ('caribbean-spiny-lobster', 'Panulirus argus.jpg',                      'Caribbean spiny lobster'),
  ('giant-clam',              'Tridacna gigas.jpg',                       'Giant clam'),
  ('elkhorn-coral',           'Acropora palmata.jpg',                     'Elkhorn coral'),
  ('grooved-brain-coral',     'Diploria labyrinthiformis.jpg',            'Grooved brain coral')
) as v(species_slug, file, caption)
join public.species sp on sp.slug = v.species_slug
where not exists (
  select 1 from public.photos p
  where p.external_url = 'https://commons.wikimedia.org/wiki/Special:FilePath/' || replace(v.file, ' ', '_') || '?width=1280'
);
