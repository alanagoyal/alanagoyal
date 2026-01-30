import { Playlist } from "./types";

// Default playlists with hardcoded track data
export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "hip-hop-classics",
    name: "🪐",
    description: "Essential hip hop tracks",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e1/cb/32/e1cb3268-1ba1-2c11-2f47-92ee469fac6a/09UMGIM33420.rgb.jpg/600x600bb.jpg",
    is_featured: true,
    tracks: [
      {
        id: "hh1",
        name: "Soundtrack 2 My Life",
        artist: "Kid Cudi",
        album: "Man On The Moon: The End Of Day (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e1/cb/32/e1cb3268-1ba1-2c11-2f47-92ee469fac6a/09UMGIM33420.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/5b/27/c4/5b27c4c4-bed2-fc1a-e260-79db0b87b419/mzaf_7688117321849580090.plus.aac.p.m4a",
        duration: 236,
      },
      {
        id: "hh2",
        name: "Patient",
        artist: "Post Malone",
        album: "Stoney (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e2/d7/1a/e2d71a57-eb93-2128-cd14-586acabfe0cf/21UM1IM45582.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/93/34/7e/93347e1a-5f05-a489-e61c-9f206233d64a/mzaf_15668660833559559559.plus.aac.p.m4a",
        duration: 194,
      },
      {
        id: "hh3",
        name: "Tequila Shots",
        artist: "Kid Cudi",
        album: "Man On The Moon III: The Chosen",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/ad/57/48ad57dd-f6f2-a1bc-b2a3-7241a64655bd/20UM1IM12830.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/12/79/79/1279795b-4429-3cc5-d911-eddcf69b391e/mzaf_3074465223298253130.plus.aac.p.m4a",
        duration: 193,
      },
      {
        id: "hh4",
        name: "Day 'N' Nite (nightmare)",
        artist: "Kid Cudi",
        album: "Man On The Moon: The End Of Day (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4f/8c/97/4f8c9778-cefe-51a7-b17b-7093154aad7c/09UMGIM33417.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/36/8d/2a/368d2a76-9051-8193-d2a4-d30196d8d7e0/mzaf_3178828165532453343.plus.aac.p.m4a",
        duration: 221,
      },
      {
        id: "hh5",
        name: "When I'm Alone",
        artist: "Post Malone",
        album: "Twelve Carat Toothache",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/0d/e8/8b/0de88b7c-bed9-be30-24e2-82d796e7bcf3/22UMGIM49145.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c8/b8/da/c8b8da58-2639-b814-c85b-9a173cabfc88/mzaf_13784204980139817055.plus.aac.p.m4a",
        duration: 195,
      },
      {
        id: "hh6",
        name: "Superstar (feat. Matthew Santos)",
        artist: "Lupe Fiasco",
        album: "Lupe Fiasco's The Cool",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/aa/59/00/aa59004a-e512-64df-6ceb-4e22c6bfbfd7/mzi.zvtxsdpu.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/ff/8c/32/ff8c3258-1c16-0e2c-c168-93a6a35fedc7/mzaf_6564347755099160213.plus.aac.p.m4a",
        duration: 289,
      },
      {
        id: "hh7",
        name: "Touch The Sky",
        artist: "Kanye West",
        album: "Late Registration",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/0e/90/3c/0e903c43-9d81-f91b-90f1-727a58f7fb2c/00602498824030.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/ec/72/00/ec72002a-713f-f1eb-8ddb-30d2e66a631c/mzaf_14256312986443673368.plus.aac.p.m4a",
        duration: 237,
      },
      {
        id: "hh8",
        name: "Electric Relaxation",
        artist: "A Tribe Called Quest",
        album: "The Anthology",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d1/90/11/d1901153-4595-7f2f-12d2-661be9eef883/012414149022.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/41/90/d2/4190d225-4550-5f64-9e03-9a845187743c/mzaf_1888934431571613997.plus.aac.p.m4a",
        duration: 226,
      },
      {
        id: "hh9",
        name: "It Ain't Hard to Tell",
        artist: "Nas",
        album: "Illmatic XX",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/eb/cc/b9ebccbc-5ba4-2cdb-5332-b065739abd9a/886444567619.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c4/32/83/c432830d-e8c1-e639-d794-435290abc305/mzaf_15811473820477022788.plus.aac.p.m4a",
        duration: 202,
      },
      {
        id: "hh10",
        name: "93 'Til Infinity",
        artist: "Souls Of Mischief",
        album: "93 'til Infinity",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music/22/6e/b6/mzi.xyhsjlep.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/94/06/67/94066752-e99f-dc82-ae10-38d596955de7/mzaf_17811817848882057179.plus.aac.p.m4a",
        duration: 286,
      },
      {
        id: "hh11",
        name: "Ms. Fat Booty",
        artist: "Mos Def",
        album: "Black On Both Sides",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b8/7d/a8/b87da8e7-27a4-4892-1f6f-0fd3afd48f2a/00008811290429.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/41/77/c2/4177c2ed-03db-f534-805b-3ba6f29d69c0/mzaf_11562482125859178260.plus.aac.p.m4a",
        duration: 224,
      },
      {
        id: "hh12",
        name: "Forgot About Dre",
        artist: "Dr. Dre",
        album: "2001",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/07/d4/d9/07d4d90d-704e-c10e-2203-2b18318a2064/00606949057121.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/d3/da/fa/d3dafad1-7951-a08f-a240-38c2a8314cbe/mzaf_3266524277073215935.plus.aac.p.m4a",
        duration: 222,
      },
      {
        id: "hh13",
        name: "Flashing Lights",
        artist: "Kanye West",
        album: "Graduation",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/39/25/2d/39252d65-2d50-b991-0962-f7a98a761271/00602517483507.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/c3/c6/c6/c3c6c652-2f19-1511-c8e9-e9caf9b6b4ac/mzaf_8110172512846397285.plus.aac.p.m4a",
        duration: 238,
      },
      {
        id: "hh14",
        name: "Man On The Moon",
        artist: "Kid Cudi",
        album: "Man On The Moon: The End Of Day (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e1/cb/32/e1cb3268-1ba1-2c11-2f47-92ee469fac6a/09UMGIM33420.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/a5/dd/33/a5dd33af-a418-3e2c-224d-5461047414a8/mzaf_3810015228937064190.plus.aac.p.m4a",
        duration: 211,
      },
    ],
  },
  {
    id: "electronic-chill",
    name: "🍓",
    description: "Melodic electronic vibes",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
    tracks: [
      {
        id: "ec1",
        name: "Never Loved",
        artist: "Massane",
        album: "Visage 6 (Never Loved)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/17/66/70/1766709a-2713-e4d6-7b10-46b61c774e04/mzaf_10245213937900308750.plus.aac.p.m4a",
        duration: 254,
      },
      {
        id: "ec2",
        name: "Trust",
        artist: "Massane",
        album: "Trust",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/06/b3/ff/06b3fff3-751e-460e-56c8-9512017fadb3/5039060893197.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/70/3b/9a/703b9acf-2dc7-d7c2-0b43-5a8dc9e1925a/mzaf_3989834979709231291.plus.aac.p.m4a",
        duration: 236,
      },
      {
        id: "ec3",
        name: "IOnDn",
        artist: "EMBRZ",
        album: "Don't Look Back",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/1f/e2/d5/1fe2d5c0-5f8d-1041-6847-d4f9661c9173/5039060741993.png/600x600bb.jpg",
        previewUrl: null,
        duration: 232,
      },
      {
        id: "ec4",
        name: "Adieu Us",
        artist: "Massane",
        album: "Adieu Us",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/38/ae/ab/38aeab49-c84c-4055-48f4-1aba05ddfafc/5039060998199.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1a/0b/c8/1a0bc8c5-2e08-696e-5850-9e06030aab5f/mzaf_976544986436082600.plus.aac.p.m4a",
        duration: 221,
      },
      {
        id: "ec5",
        name: "Red Lights - EMBRZ Remix",
        artist: "Lane 8, Emmit Fenn, EMBRZ",
        album: "Red Lights (EMBRZ Remix)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/1f/e2/d5/1fe2d5c0-5f8d-1041-6847-d4f9661c9173/5039060741993.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/ef/0b/79/ef0b79b9-26bd-d747-739a-04c9b06fca73/mzaf_8710538143606955806.plus.aac.p.m4a",
        duration: 206,
      },
      {
        id: "ec6",
        name: "Home In My Hand",
        artist: "Dirty South, Julia Church",
        album: "Home In My Hand",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0f/7e/c7/0f7ec79d-a7c8-fb0b-e4b1-a1426e8aeeef/5039060916193.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/c6/6d/40/c66d40b6-b935-5a77-f035-11b9d631d6a0/mzaf_8088928302380097159.plus.aac.p.m4a",
        duration: 298,
      },
      {
        id: "ec7",
        name: "Craving",
        artist: "Massane, Benjamin Roustaing",
        album: "Craving",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/25/de/4f/25de4f5f-2d37-de37-9ec0-37dab4499b12/5039060860199.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/12/70/37/1270371a-3f5d-9c5e-dc89-c82f02faa6ef/mzaf_10628321815901126584.plus.aac.p.m4a",
        duration: 223,
      },
      {
        id: "ec8",
        name: "Wintry Wind",
        artist: "Massane",
        album: "Visage 4 (By My Side)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0c/6e/a7/0c6ea7ef-6796-997d-b525-fbf523a168b6/255ef555-7312-4f98-b886-cdccb25cc758.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/21/74/9e/21749eb5-ef55-b016-d4e2-47574b49dc23/mzaf_7084567821994171039.plus.aac.p.m4a",
        duration: 308,
      },
      {
        id: "ec9",
        name: "Iris",
        artist: "Steffan Blaze",
        album: "Iris",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8b/42/06/8b4206dd-cd17-d012-66f2-126511014409/cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/7a/5e/e7/7a5ee711-a9a6-3aab-a6e4-272d2f3ee16f/mzaf_15325224580128957694.plus.aac.p.m4a",
        duration: 340,
      },
      {
        id: "ec10",
        name: "Magnify - Edit",
        artist: "Around Us",
        album: "Magnify",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/43/9b/47/439b47ea-48c3-2e5c-1051-b54b559fa6a5/cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/f7/c9/39/f7c93944-cd41-50c3-07e4-0a6d8fd1c259/mzaf_352216722004051040.plus.aac.p.m4a",
        duration: 255,
      },
      {
        id: "ec11",
        name: "Fade to Blue",
        artist: "Ben Böhmer",
        album: "Begin Again",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/85/1e/cb/851ecbdf-84e9-80ac-95c5-4cd8edbfc128/5039060664698.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/69/f1/98/69f19877-fc2f-c838-ab15-0a7b019687bd/mzaf_5379332135311315042.plus.aac.p.m4a",
        duration: 289,
      },
      {
        id: "ec12",
        name: "More Than You Ever Know",
        artist: "Sultan + Shepard, Angela McCluskey",
        album: "Indigo EP",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1e/1a/89/1e1a89e5-eee9-c2bf-6ddb-c08891c336b3/5039060716991.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/82/ba/32/82ba3240-bb66-609c-1a77-aa99fda595cc/mzaf_4585938177350545158.plus.aac.p.m4a",
        duration: 297,
      },
      {
        id: "ec13",
        name: "Isolation",
        artist: "Massane",
        album: "Visage 6 (Never Loved)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/0e/06/c8/0e06c844-3bbb-5000-32bf-a5f6bb50d7be/mzaf_18331433691988275563.plus.aac.p.m4a",
        duration: 280,
      },
      {
        id: "ec14",
        name: "Never Do",
        artist: "Bacavi",
        album: "Never Do",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ef/fc/85/effc8546-28b6-5bc8-5073-8ef9d5026ee4/f3cadc35-b798-4f9e-9610-a33113f226b9.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview122/v4/b0/15/4c/b0154c3e-aef7-cada-3931-b644fbd201f5/mzaf_10494099710926025844.plus.aac.p.m4a",
        duration: 288,
      },
      {
        id: "ec15",
        name: "11-11",
        artist: "Qrion",
        album: "11-11",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3e/e1/6b/3ee16b7c-13b4-b945-84f0-44c3664ca5fa/5039060683590.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/cd/b1/6c/cdb16c32-7da2-0533-01bd-7f3e7dff64ea/mzaf_4509347262842045113.plus.aac.p.m4a",
        duration: 247,
      },
      {
        id: "ec16",
        name: "Wild Skies - Marsh Remix",
        artist: "Eli & Fur, Marsh",
        album: "Found In The Wild (Remixed)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3e/2d/4b/3e2d4bb3-ac4c-be04-5d0e-1f27f928faa4/5039060647790.png/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/50/8b/0d/508b0de3-1e82-ba90-ec56-4cf66b13903a/mzaf_6132932034312528792.plus.aac.p.m4a",
        duration: 237,
      },
      {
        id: "ec17",
        name: "Last Breath - Adult Art Club Remix",
        artist: "Lastlings, Adult Art Club",
        album: "First Contact (The Remixes)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f0/29/d5/f029d5d1-53ee-6176-7a6e-f4e037da7a26/20UMGIM52778.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/6f/3a/45/6f3a45f7-5dfe-16cc-87f7-1369fefded15/mzaf_16871765182401267994.plus.aac.p.m4a",
        duration: 420,
      },
    ],
  },
  {
    id: "country",
    name: "🤠",
    description: "Modern country hits",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
    tracks: [
      {
        id: "c1",
        name: "One Thing At A Time",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/9a/f0/47/9af047a6-2244-0ee0-d444-6bc3406ae437/mzaf_6876623592490975855.plus.aac.p.m4a",
        duration: 207,
      },
      {
        id: "c2",
        name: "I Had Some Help (Feat. Morgan Wallen)",
        artist: "Post Malone, Morgan Wallen",
        album: "I Had Some Help",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/84/df/b9/84dfb96b-27c8-4d40-4780-b65ff22790e4/24UMGIM50612.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/1f/70/04/1f7004b7-414e-a89c-0148-abdd38981be8/mzaf_10246855408392712577.plus.aac.p.m4a",
        duration: 178,
      },
      {
        id: "c3",
        name: "Heartless (feat. Morgan Wallen)",
        artist: "Diplo, Morgan Wallen",
        album: "Diplo Presents Thomas Wesley: Chapter 1",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/30/e3/d8/30e3d8f0-0f7b-c476-17a7-f40219cc55c0/886448459637.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/17/d7/41/17d741c8-2eb8-bbee-d19c-0c3354ae6c04/mzaf_7511496811064222157.plus.aac.p.m4a",
        duration: 169,
      },
      {
        id: "c4",
        name: "More Than My Hometown",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/da/f9/40/daf940c2-6185-3fc3-341c-044670991d66/mzaf_14800514912575979098.plus.aac.p.m4a",
        duration: 217,
      },
      {
        id: "c5",
        name: "Wine Into Whiskey",
        artist: "Tucker Wetmore",
        album: "Wine Into Whiskey",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c6/81/8d/c6818dc9-b46d-3637-1474-3786342e6c79/24UMGIM54948.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/07/8d/c3/078dc344-c758-f729-79aa-0aa8f1b8c4eb/mzaf_5987950524977885195.plus.aac.p.m4a",
        duration: 166,
      },
      {
        id: "c6",
        name: "Last Night",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/db/9f/8e/db9f8e0c-d947-b7fd-cc93-a832c81ce4ee/00602455241252_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/87/0e/ef/870eef82-decb-8804-d0af-2f174f111e9b/mzaf_5505022907758473489.plus.aac.p.m4a",
        duration: 164,
      },
      {
        id: "c7",
        name: "Dangerous",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/6e/ba/da/6ebada03-a00f-0d27-14bc-2a0eb351a2ff/mzaf_5514026431661954238.plus.aac.p.m4a",
        duration: 148,
      },
      {
        id: "c8",
        name: "Still Goin Down",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1b/17/0e/1b170e8b-642e-979a-b023-fe85e0f55d88/mzaf_2948325257117822353.plus.aac.p.m4a",
        duration: 186,
      },
      {
        id: "c9",
        name: "180 (Lifestyle)",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/19/95/43/1995430a-4dfa-16ce-fda1-4b22682c24cd/mzaf_15362578115897993783.plus.aac.p.m4a",
        duration: 189,
      },
      {
        id: "c10",
        name: "Sunrise",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fc/b8/76/fcb87639-4a10-ac8d-a7a8-913c0475dd7d/mzaf_13291946928455253607.plus.aac.p.m4a",
        duration: 183,
      },
      {
        id: "c11",
        name: "7 Summers",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/d1/59/4a/d1594a22-941e-b5c6-1b1b-4ff19019fe8c/mzaf_9336570969741700312.plus.aac.p.m4a",
        duration: 211,
      },
      {
        id: "c12",
        name: "Me + All Your Reasons",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/79/1b/31/791b3125-79db-342a-83e2-2485090c2375/mzaf_2253935218159693267.plus.aac.p.m4a",
        duration: 175,
      },
      {
        id: "c13",
        name: "You Proof",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/aa/b4/3d/aab43d30-c32c-1468-ae98-8df954cfd49d/mzaf_10168278704795830804.plus.aac.p.m4a",
        duration: 157,
      },
      {
        id: "c14",
        name: "Neon Eyes",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/68/05/ab/6805abb2-10d1-35cb-aa84-71386b285b7d/00602435514642_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/48/ff/97/48ff97ac-c760-e084-2223-43911e517962/mzaf_16141596738009085683.plus.aac.p.m4a",
        duration: 226,
      },
      {
        id: "c15",
        name: "Thinkin' Bout Me",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/bc/5d/c0bc5d1f-932c-f2b0-9822-0ac60a1aa34f/mzaf_14050483254678191662.plus.aac.p.m4a",
        duration: 177,
      },
      {
        id: "c16",
        name: "Chasin' You",
        artist: "Morgan Wallen",
        album: "If I Know Me",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/80/bb/18/80bb1895-326f-e618-9aa8-d2338bb35f0c/842812106569_Cover.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/03/06/e4/0306e44d-7c0a-6970-8d28-dc6e60e85860/mzaf_1117196817691298474.plus.aac.p.m4a",
        duration: 205,
      },
    ],
  },
  {
    id: "pop-hits",
    name: "🪄",
    description: "Today's top pop tracks",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/18/75/d5/1875d587-3892-c732-8edb-e864c5a53b5b/21UMGIM11942.rgb.jpg/600x600bb.jpg",
    tracks: [
      {
        id: "p1",
        name: "positions",
        artist: "Ariana Grande",
        album: "Positions",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/18/75/d5/1875d587-3892-c732-8edb-e864c5a53b5b/21UMGIM11942.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/47/c3/58/47c358c6-abd4-68ec-29c5-9b02d54bfc28/mzaf_9822989664600891039.plus.aac.p.m4a",
        duration: 172,
      },
      {
        id: "p2",
        name: "Houdini",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/2a/0c/e0/2a0ce04a-4155-72a3-ba8f-e0344f49536d/mzaf_17581444001185566790.plus.aac.p.m4a",
        duration: 186,
      },
      {
        id: "p3",
        name: "Saturn Returns Interlude",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/61/c0/e9/61c0e9cc-14bc-c2ce-80ed-e2bdabde586d/mzaf_1564484983528849228.plus.aac.p.m4a",
        duration: 42,
      },
      {
        id: "p4",
        name: "eternal sunshine",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f6/02/de/f602def3-f9e3-810e-295f-77541378e7df/mzaf_14890725939766078402.plus.aac.p.m4a",
        duration: 210,
      },
      {
        id: "p5",
        name: "Illusion",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/25/04/d9/2504d908-2a6a-64df-be8d-c6916ff0b763/mzaf_11647511398423168038.plus.aac.p.m4a",
        duration: 188,
      },
      {
        id: "p6",
        name: "Training Season",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a8/87/16/a88716e2-9474-ec4e-06d6-d3a9a3ba96c8/mzaf_6258558385119267725.plus.aac.p.m4a",
        duration: 209,
      },
      {
        id: "p7",
        name: "true story",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3f/67/1a/3f671a04-d2b9-3c9b-8fc7-16e1ae09adb4/mzaf_1886178331073595172.plus.aac.p.m4a",
        duration: 163,
      },
      {
        id: "p8",
        name: "French Exit",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/5e/06/d5/5e06d58d-805a-8188-772c-470d51b3db1b/mzaf_15359532553955057656.plus.aac.p.m4a",
        duration: 201,
      },
      {
        id: "p9",
        name: "ordinary things (feat. Nonna)",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/03/03/0a/03030a73-cd48-303d-9d5f-bd30b1940857/mzaf_4619217814539342468.plus.aac.p.m4a",
        duration: 169,
      },
      {
        id: "p10",
        name: "the boy is mine",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e6/00/45/e60045df-470f-139e-05a4-daf1e9624f37/mzaf_18262910042562106357.plus.aac.p.m4a",
        duration: 174,
      },
      {
        id: "p11",
        name: "I Can Do It With a Broken Heart",
        artist: "Taylor Swift",
        album: "THE TORTURED POETS DEPARTMENT",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/67/b5/01/67b501d5-362e-797e-7dbd-942b9e273084/22UM1IM24801.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/b6/f0/84/b6f084fb-7f92-40af-55e9-5954e305fec5/mzaf_11589424948526400763.plus.aac.p.m4a",
        duration: 218,
      },
      {
        id: "p12",
        name: "Please Please Please",
        artist: "Sabrina Carpenter",
        album: "Please Please Please",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a1/1c/ca/a11ccab6-7d4c-e041-d028-998bcebeb709/24UMGIM61704.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/54/86/0b/54860b8b-0c3b-b16b-5b19-b00424af8b9b/mzaf_1272478887800630516.plus.aac.p.m4a",
        duration: 186,
      },
      {
        id: "p13",
        name: "Karma",
        artist: "Taylor Swift",
        album: "Midnights",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/67/b5/01/67b501d5-362e-797e-7dbd-942b9e273084/22UM1IM24801.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5f/37/bf/5f37bff2-2413-d187-c153-7ffb2a93d022/mzaf_18258475033098661061.plus.aac.p.m4a",
        duration: 205,
      },
      {
        id: "p14",
        name: "bye",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/03/27/73/032773f2-c7b4-6eec-abcc-c50660d74846/mzaf_2090113539611251578.plus.aac.p.m4a",
        duration: 165,
      },
      {
        id: "p15",
        name: "love is embarrassing",
        artist: "Olivia Rodrigo",
        album: "GUTS",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/9e/0d/17/9e0d17e0-c068-fbd9-fd85-610cc87c86aa/23UMGIM71511.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/c4/33/f3/c433f36c-b112-1cb9-121a-cf0eef449bb5/mzaf_14409077373197914279.plus.aac.p.m4a",
        duration: 155,
      },
      {
        id: "p16",
        name: "jealousy, jealousy",
        artist: "Olivia Rodrigo",
        album: "SOUR",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/33/fd/32/33fd32b1-0e43-9b4a-8ed6-19643f23544e/21UMGIM26092.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/3c/32/4d/3c324da9-8155-9d42-9c17-c3dad4d56a28/mzaf_4684856614573124364.plus.aac.p.m4a",
        duration: 173,
      },
      {
        id: "p17",
        name: "ballad of a homeschooled girl",
        artist: "Olivia Rodrigo",
        album: "GUTS",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9b/d8/9c/9bd89c9e-b44d-ad25-1516-b9b30f64fd2a/23UMGIM71510.rgb.jpg/600x600bb.jpg",
        previewUrl: "https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/05/fa/bf05fa31-f7e1-9d8e-348f-6e7fedff2358/mzaf_17621267818553057506.plus.aac.p.m4a",
        duration: 203,
      },
    ],
  },
];

// Get all unique albums from playlists
export function getAlbumsFromPlaylists(): {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  trackCount: number;
}[] {
  const albumMap = new Map<
    string,
    { id: string; name: string; artist: string; albumArt: string; trackCount: number }
  >();

  for (const playlist of DEFAULT_PLAYLISTS) {
    for (const track of playlist.tracks) {
      const albumKey = `${track.album}-${track.artist}`;
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          id: albumKey,
          name: track.album,
          artist: track.artist,
          albumArt: track.albumArt,
          trackCount: 1,
        });
      } else {
        const album = albumMap.get(albumKey);
        if (album) {
          album.trackCount++;
        }
      }
    }
  }

  return Array.from(albumMap.values());
}

// Get all unique artists from playlists
export function getArtistsFromPlaylists(): {
  id: string;
  name: string;
  image: string;
  trackCount: number;
}[] {
  const artistMap = new Map<
    string,
    { id: string; name: string; image: string; trackCount: number }
  >();

  for (const playlist of DEFAULT_PLAYLISTS) {
    for (const track of playlist.tracks) {
      if (!artistMap.has(track.artist)) {
        artistMap.set(track.artist, {
          id: track.artist.toLowerCase().replace(/\s+/g, "-"),
          name: track.artist,
          image: track.albumArt,
          trackCount: 1,
        });
      } else {
        const artist = artistMap.get(track.artist);
        if (artist) {
          artist.trackCount++;
        }
      }
    }
  }

  return Array.from(artistMap.values());
}

// Get all songs from playlists
export function getAllSongs() {
  const songs = new Map<string, (typeof DEFAULT_PLAYLISTS)[0]["tracks"][0]>();

  for (const playlist of DEFAULT_PLAYLISTS) {
    for (const track of playlist.tracks) {
      if (!songs.has(track.id)) {
        songs.set(track.id, track);
      }
    }
  }

  return Array.from(songs.values());
}

// Get the featured playlist
export function getFeaturedPlaylist() {
  return DEFAULT_PLAYLISTS.find((p) => p.is_featured) || DEFAULT_PLAYLISTS[0];
}
