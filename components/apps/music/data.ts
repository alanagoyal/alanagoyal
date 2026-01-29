import { Playlist } from "./types";

// Default playlists with hardcoded track data
export const DEFAULT_PLAYLISTS: Playlist[] = [
  {
    id: "hip-hop-classics",
    name: "Hip Hop Classics",
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
        previewUrl: null,
        duration: 236,
      },
      {
        id: "hh2",
        name: "Patient",
        artist: "Post Malone",
        album: "Stoney (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/e2/d7/1a/e2d71a57-eb93-2128-cd14-586acabfe0cf/21UM1IM45582.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 194,
      },
      {
        id: "hh3",
        name: "Tequila Shots",
        artist: "Kid Cudi",
        album: "Man On The Moon III: The Chosen",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/48/ad/57/48ad57dd-f6f2-a1bc-b2a3-7241a64655bd/20UM1IM12830.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 193,
      },
      {
        id: "hh4",
        name: "Day 'N' Nite (nightmare)",
        artist: "Kid Cudi",
        album: "Man On The Moon: The End Of Day (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/4f/8c/97/4f8c9778-cefe-51a7-b17b-7093154aad7c/09UMGIM33417.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 221,
      },
      {
        id: "hh5",
        name: "When I'm Alone",
        artist: "Post Malone",
        album: "Twelve Carat Toothache",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/0d/e8/8b/0de88b7c-bed9-be30-24e2-82d796e7bcf3/22UMGIM49145.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 195,
      },
      {
        id: "hh6",
        name: "Superstar (feat. Matthew Santos)",
        artist: "Lupe Fiasco",
        album: "Lupe Fiasco's The Cool",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/aa/59/00/aa59004a-e512-64df-6ceb-4e22c6bfbfd7/mzi.zvtxsdpu.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 289,
      },
      {
        id: "hh7",
        name: "Touch The Sky",
        artist: "Kanye West",
        album: "Late Registration",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/0e/90/3c/0e903c43-9d81-f91b-90f1-727a58f7fb2c/00602498824030.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 237,
      },
      {
        id: "hh8",
        name: "Electric Relaxation",
        artist: "A Tribe Called Quest",
        album: "The Anthology",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/d1/90/11/d1901153-4595-7f2f-12d2-661be9eef883/012414149022.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 226,
      },
      {
        id: "hh9",
        name: "It Ain't Hard to Tell",
        artist: "Nas",
        album: "Illmatic XX",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b9/eb/cc/b9ebccbc-5ba4-2cdb-5332-b065739abd9a/886444567619.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 202,
      },
      {
        id: "hh10",
        name: "93 'Til Infinity",
        artist: "Souls Of Mischief",
        album: "93 'til Infinity",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music/22/6e/b6/mzi.xyhsjlep.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 286,
      },
      {
        id: "hh11",
        name: "Ms. Fat Booty",
        artist: "Mos Def",
        album: "Black On Both Sides",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/b8/7d/a8/b87da8e7-27a4-4892-1f6f-0fd3afd48f2a/00008811290429.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 224,
      },
      {
        id: "hh12",
        name: "Forgot About Dre",
        artist: "Dr. Dre",
        album: "2001",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/07/d4/d9/07d4d90d-704e-c10e-2203-2b18318a2064/00606949057121.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 222,
      },
      {
        id: "hh13",
        name: "Flashing Lights",
        artist: "Kanye West",
        album: "Graduation",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music128/v4/39/25/2d/39252d65-2d50-b991-0962-f7a98a761271/00602517483507.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 238,
      },
      {
        id: "hh14",
        name: "Man On The Moon",
        artist: "Kid Cudi",
        album: "Man On The Moon: The End Of Day (Deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/e1/cb/32/e1cb3268-1ba1-2c11-2f47-92ee469fac6a/09UMGIM33420.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 211,
      },
    ],
  },
  {
    id: "electronic-chill",
    name: "Electronic Chill",
    description: "Melodic electronic vibes",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
    tracks: [
      {
        id: "ec1",
        name: "Never Loved",
        artist: "Massane",
        album: "Visage 6 (Never Loved)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
        previewUrl: null,
        duration: 254,
      },
      {
        id: "ec2",
        name: "Trust",
        artist: "Massane",
        album: "Trust",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/06/b3/ff/06b3fff3-751e-460e-56c8-9512017fadb3/5039060893197.png/600x600bb.jpg",
        previewUrl: null,
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
        previewUrl: null,
        duration: 221,
      },
      {
        id: "ec5",
        name: "Red Lights - EMBRZ Remix",
        artist: "Lane 8, Emmit Fenn, EMBRZ",
        album: "Red Lights (EMBRZ Remix)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/1f/e2/d5/1fe2d5c0-5f8d-1041-6847-d4f9661c9173/5039060741993.png/600x600bb.jpg",
        previewUrl: null,
        duration: 206,
      },
      {
        id: "ec6",
        name: "Home In My Hand",
        artist: "Dirty South, Julia Church",
        album: "Home In My Hand",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0f/7e/c7/0f7ec79d-a7c8-fb0b-e4b1-a1426e8aeeef/5039060916193.png/600x600bb.jpg",
        previewUrl: null,
        duration: 298,
      },
      {
        id: "ec7",
        name: "Craving",
        artist: "Massane, Benjamin Roustaing",
        album: "Craving",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/25/de/4f/25de4f5f-2d37-de37-9ec0-37dab4499b12/5039060860199.png/600x600bb.jpg",
        previewUrl: null,
        duration: 223,
      },
      {
        id: "ec8",
        name: "Wintry Wind",
        artist: "Massane",
        album: "Visage 4 (By My Side)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/0c/6e/a7/0c6ea7ef-6796-997d-b525-fbf523a168b6/255ef555-7312-4f98-b886-cdccb25cc758.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 308,
      },
      {
        id: "ec9",
        name: "Iris",
        artist: "Steffan Blaze",
        album: "Iris",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/8b/42/06/8b4206dd-cd17-d012-66f2-126511014409/cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 340,
      },
      {
        id: "ec10",
        name: "Magnify - Edit",
        artist: "Around Us",
        album: "Magnify",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/43/9b/47/439b47ea-48c3-2e5c-1051-b54b559fa6a5/cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 255,
      },
      {
        id: "ec11",
        name: "Fade to Blue",
        artist: "Ben Böhmer",
        album: "Begin Again",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/85/1e/cb/851ecbdf-84e9-80ac-95c5-4cd8edbfc128/5039060664698.png/600x600bb.jpg",
        previewUrl: null,
        duration: 289,
      },
      {
        id: "ec12",
        name: "More Than You Ever Know",
        artist: "Sultan + Shepard, Angela McCluskey",
        album: "Indigo EP",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/1e/1a/89/1e1a89e5-eee9-c2bf-6ddb-c08891c336b3/5039060716991.png/600x600bb.jpg",
        previewUrl: null,
        duration: 297,
      },
      {
        id: "ec13",
        name: "Isolation",
        artist: "Massane",
        album: "Visage 6 (Never Loved)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4f/74/90/4f7490f2-c725-0179-bc26-bce83d2cc44f/5039060800898.png/600x600bb.jpg",
        previewUrl: null,
        duration: 280,
      },
      {
        id: "ec14",
        name: "Never Do",
        artist: "Bacavi",
        album: "Never Do",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/ef/fc/85/effc8546-28b6-5bc8-5073-8ef9d5026ee4/f3cadc35-b798-4f9e-9610-a33113f226b9.png/600x600bb.jpg",
        previewUrl: null,
        duration: 288,
      },
      {
        id: "ec15",
        name: "11-11",
        artist: "Qrion",
        album: "11-11",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/3e/e1/6b/3ee16b7c-13b4-b945-84f0-44c3664ca5fa/5039060683590.png/600x600bb.jpg",
        previewUrl: null,
        duration: 247,
      },
      {
        id: "ec16",
        name: "Wild Skies - Marsh Remix",
        artist: "Eli & Fur, Marsh",
        album: "Found In The Wild (Remixed)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/3e/2d/4b/3e2d4bb3-ac4c-be04-5d0e-1f27f928faa4/5039060647790.png/600x600bb.jpg",
        previewUrl: null,
        duration: 237,
      },
      {
        id: "ec17",
        name: "Last Breath - Adult Art Club Remix",
        artist: "Lastlings, Adult Art Club",
        album: "First Contact (The Remixes)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f0/29/d5/f029d5d1-53ee-6176-7a6e-f4e037da7a26/20UMGIM52778.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 420,
      },
    ],
  },
  {
    id: "country",
    name: "Country",
    description: "Modern country hits",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
    tracks: [
      {
        id: "c1",
        name: "One Thing At A Time",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 207,
      },
      {
        id: "c2",
        name: "I Had Some Help (Feat. Morgan Wallen)",
        artist: "Post Malone, Morgan Wallen",
        album: "I Had Some Help",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/84/df/b9/84dfb96b-27c8-4d40-4780-b65ff22790e4/24UMGIM50612.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 178,
      },
      {
        id: "c3",
        name: "Heartless (feat. Morgan Wallen)",
        artist: "Diplo, Morgan Wallen",
        album: "Diplo Presents Thomas Wesley: Chapter 1",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/30/e3/d8/30e3d8f0-0f7b-c476-17a7-f40219cc55c0/886448459637.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 169,
      },
      {
        id: "c4",
        name: "More Than My Hometown",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 217,
      },
      {
        id: "c5",
        name: "Wine Into Whiskey",
        artist: "Tucker Wetmore",
        album: "Wine Into Whiskey",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c6/81/8d/c6818dc9-b46d-3637-1474-3786342e6c79/24UMGIM54948.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 166,
      },
      {
        id: "c6",
        name: "Last Night",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/db/9f/8e/db9f8e0c-d947-b7fd-cc93-a832c81ce4ee/00602455241252_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 164,
      },
      {
        id: "c7",
        name: "Dangerous",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 148,
      },
      {
        id: "c8",
        name: "Still Goin Down",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 186,
      },
      {
        id: "c9",
        name: "180 (Lifestyle)",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 189,
      },
      {
        id: "c10",
        name: "Sunrise",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 183,
      },
      {
        id: "c11",
        name: "7 Summers",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/c7/e4/b5/c7e4b540-65fa-3673-25a0-b8749a600738/00602435791388_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 211,
      },
      {
        id: "c12",
        name: "Me + All Your Reasons",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 175,
      },
      {
        id: "c13",
        name: "You Proof",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 157,
      },
      {
        id: "c14",
        name: "Neon Eyes",
        artist: "Morgan Wallen",
        album: "Dangerous: The Double Album",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/68/05/ab/6805abb2-10d1-35cb-aa84-71386b285b7d/00602435514642_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 226,
      },
      {
        id: "c15",
        name: "Thinkin' Bout Me",
        artist: "Morgan Wallen",
        album: "One Thing At A Time",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/82/eb/b3/82ebb3c6-2bd4-31fd-0eb9-57667f3590e1/00602455239419_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 177,
      },
      {
        id: "c16",
        name: "Chasin' You",
        artist: "Morgan Wallen",
        album: "If I Know Me",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/80/bb/18/80bb1895-326f-e618-9aa8-d2338bb35f0c/842812106569_Cover.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 205,
      },
    ],
  },
  {
    id: "pop-hits",
    name: "Pop Hits",
    description: "Today's top pop tracks",
    coverArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/18/75/d5/1875d587-3892-c732-8edb-e864c5a53b5b/21UMGIM11942.rgb.jpg/600x600bb.jpg",
    tracks: [
      {
        id: "p1",
        name: "positions",
        artist: "Ariana Grande",
        album: "Positions",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/18/75/d5/1875d587-3892-c732-8edb-e864c5a53b5b/21UMGIM11942.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 172,
      },
      {
        id: "p2",
        name: "Houdini",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 186,
      },
      {
        id: "p3",
        name: "Saturn Returns Interlude",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 42,
      },
      {
        id: "p4",
        name: "eternal sunshine",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 210,
      },
      {
        id: "p5",
        name: "Illusion",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 188,
      },
      {
        id: "p6",
        name: "Training Season",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 209,
      },
      {
        id: "p7",
        name: "true story",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/2e/88/88/2e8888ad-a0cf-eece-70a7-1ff81377a3ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 163,
      },
      {
        id: "p8",
        name: "French Exit",
        artist: "Dua Lipa",
        album: "Radical Optimism",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/ed/e8/1c/ede81c4b-593d-913a-cfe4-3b12496f67e5/5021732254870.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 201,
      },
      {
        id: "p9",
        name: "ordinary things (feat. Nonna)",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 169,
      },
      {
        id: "p10",
        name: "the boy is mine",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 174,
      },
      {
        id: "p11",
        name: "I Can Do It With a Broken Heart",
        artist: "Taylor Swift",
        album: "THE TORTURED POETS DEPARTMENT",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/67/b5/01/67b501d5-362e-797e-7dbd-942b9e273084/22UM1IM24801.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 218,
      },
      {
        id: "p12",
        name: "Please Please Please",
        artist: "Sabrina Carpenter",
        album: "Please Please Please",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/a1/1c/ca/a11ccab6-7d4c-e041-d028-998bcebeb709/24UMGIM61704.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 186,
      },
      {
        id: "p13",
        name: "Karma",
        artist: "Taylor Swift",
        album: "Midnights",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/67/b5/01/67b501d5-362e-797e-7dbd-942b9e273084/22UM1IM24801.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 205,
      },
      {
        id: "p14",
        name: "bye",
        artist: "Ariana Grande",
        album: "eternal sunshine (slightly deluxe)",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music122/v4/34/fe/a1/34fea184-6d20-3f50-b4ce-5e1501c1c5ab/24UMGIM00198.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 165,
      },
      {
        id: "p15",
        name: "love is embarrassing",
        artist: "Olivia Rodrigo",
        album: "GUTS",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/9e/0d/17/9e0d17e0-c068-fbd9-fd85-610cc87c86aa/23UMGIM71511.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 155,
      },
      {
        id: "p16",
        name: "jealousy, jealousy",
        artist: "Olivia Rodrigo",
        album: "SOUR",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/33/fd/32/33fd32b1-0e43-9b4a-8ed6-19643f23544e/21UMGIM26092.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
        duration: 173,
      },
      {
        id: "p17",
        name: "ballad of a homeschooled girl",
        artist: "Olivia Rodrigo",
        album: "GUTS",
        albumArt: "https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/9b/d8/9c/9bd89c9e-b44d-ad25-1516-b9b30f64fd2a/23UMGIM71510.rgb.jpg/600x600bb.jpg",
        previewUrl: null,
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
        albumMap.get(albumKey)!.trackCount++;
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
        artistMap.get(track.artist)!.trackCount++;
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
