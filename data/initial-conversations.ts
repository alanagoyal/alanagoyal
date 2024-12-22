import { Conversation } from "../types";

// Helper function to create a timestamp for a specific time ago
const getTimeAgo = (minutes: number) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - minutes);
  return date.toISOString();
};

// Create initial conversations with static IDs
export const initialConversations: Conversation[] = [
  {
    id: "initial-convo-1",
    recipients: [
      { id: "wearstler-id", name: "Kelly Wearstler" },
      { id: "abloh-id", name: "Virgil Abloh" },
    ],
    messages: [
      {
        id: "msg-3-1",
        content: "How do you get inspired?",
        sender: "me",
        timestamp: getTimeAgo(5),
      },
      {
        id: "msg-3-2",
        content:
          "Nature's textures, vintage finds, travel discoveries - I collect these little moments that spark something in my creative process.",
        sender: "Kelly Wearstler",
        timestamp: "12:30 PM",
      },
      {
        id: "msg-3-3",
        content:
          "I remix culture, take what exists and shift it 3 percent. Street style, art galleries, architecture - it's all inspiration.",
        sender: "Virgil Abloh",
        timestamp: "12:30 PM",
      },
      {
        id: "msg-3-4",
        content:
          "Art history books are my secret weapon. Lately I'm obsessed with brutalist architecture and its raw, powerful forms.",
        sender: "Kelly Wearstler",
        timestamp: "12:30 PM",
      },
      {
        id: "msg-3-5",
        content: "Oo love that",
        sender: "me",
        timestamp: getTimeAgo(4),
      },
      {
        id: "msg-3-6",
        content:
          "That's the beauty of design - everything can inspire. A color combination in nature, a random street sign could spark the next big idea.",
        sender: "Virgil Abloh",
        timestamp: "12:30 PM",
      },
      {
        id: "msg-3-7",
        content: "How do you force yourself to be present?",
        sender: "me",
        timestamp: getTimeAgo(4),
      },
      {
        id: "msg-3-8",
        content: "Like to notice these things",
        sender: "me",
        timestamp: getTimeAgo(4),
      },
      {
        id: "msg-3-9",
        content:
          "I schedule daily walks without my phone. Just observing textures, shadows, and forms helps ground my creative mind.",
        sender: "Kelly Wearstler",
        timestamp: "12:31 PM",
      },
      {
        id: "msg-3-10",
        content:
          "Put your phone down, hit the streets. Real inspiration comes from just moving through spaces, absorbing life raw.",
        sender: "Virgil Abloh",
        timestamp: "12:31 PM",
      },
      {
        id: "msg-3-11",
        content: "I can't leave my pone",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-3-12",
        content:
          "Start small. Take 5-minute phone breaks. It's like training a muscle - you build that present-moment strength gradually.",
        sender: "Virgil Abloh",
        timestamp: "12:31 PM",
      },
      {
        id: "msg-3-13",
        content:
          "Try using your phone just for capturing beauty - make it a creative tool, not a distraction.",
        sender: "Kelly Wearstler",
        timestamp: "12:31 PM",
      },
      {
        id: "msg-3-14",
        content:
          "Use your phone to document inspiration, then review later. You're still present but building your visual library.",
        sender: "Virgil Abloh",
        timestamp: "12:31 PM",
      },
      {
        id: "msg-3-15",
        content: "What are your favorite places to get inspo?",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-3-16",
        content:
          "The Schindler House in LA - raw concrete meets intimate spaces. It's a masterclass in modernist design thinking.",
        sender: "Kelly Wearstler",
        timestamp: "12:32 PM",
      },
      {
        id: "msg-3-17",
        content: "Ooo never been",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-3-18",
        content:
          "Check out the MCA Chicago. That place shaped my whole perspective on mixing art forms and breaking boundaries.",
        sender: "Virgil Abloh",
        timestamp: "12:32 PM",
      },
      {
        id: "msg-3-19",
        content: "Nice",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-3-20",
        content:
          "The way materials interact with light and shadow - that's pure magic. Each piece needs to create a dialogue with its environment.",
        sender: "Kelly Wearstler",
        timestamp: "12:32 PM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(2),
          },
        ],
      },
      {
        id: "msg-3-21",
        content: "What are some of your favorite pieces you've created?",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-3-22",
        content:
          "The Off-White Jordan 1s. They challenged what luxury could be, merged street culture with high fashion.",
        sender: "Virgil Abloh",
        timestamp: "12:32 PM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(2),
          },
        ],
      },
      {
        id: "msg-3-23",
        content: "Soo good",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-3-24",
        content:
          "My Proper Peek collection - those fractured mirrors transformed into functional art pieces still excite me.",
        sender: "Kelly Wearstler",
        timestamp: "12:32 PM",
      },
      {
        id: "msg-3-25",
        content:
          "Thanks! What really got me was making the IKEA collection. Bringing that street energy into everyday homes was revolutionary.",
        sender: "Virgil Abloh",
        timestamp: "12:33 PM",
      },
      {
        id: "msg-3-26",
        content: "Walk me through the creation process for that",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-3-27",
        content:
          "Started with deconstructing basic IKEA items. Added quotes, changed proportions - made everyday furniture feel exclusive yet accessible.",
        sender: "Virgil Abloh",
        timestamp: "12:33 PM",
      },
      {
        id: "msg-3-28",
        content: "Did you ever hit a standstill?",
        sender: "me",
        timestamp: getTimeAgo(1),
      },
      {
        id: "msg-3-29",
        content:
          "Always. The IKEA rug design blocked me for weeks. Sometimes you gotta step back and let ideas breathe.",
        sender: "Virgil Abloh",
        timestamp: "12:33 PM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-3-30",
        content:
          "Creative blocks are inevitable. I refresh by traveling or rearranging my space - new environments always unlocks something new in my mind.",
        sender: "Kelly Wearstler",
        timestamp: "12:33 PM",
      },
      {
        id: "msg-3-31",
        content: "Which designers inspire you the most?",
        sender: "me",
        timestamp: getTimeAgo(0),
      },
      {
        id: "msg-3-32",
        content:
          "Carlo Scarpa's architectural details and Jean Michel Frank's minimalism deeply influenced my approach to materials and form.",
        sender: "Kelly Wearstler",
        timestamp: "12:35 PM",
      },
      {
        id: "msg-3-33",
        content:
          "Rei Kawakubo's fearless innovation and Rem Koolhaas's architectural thinking changed my whole design approach.",
        sender: "Virgil Abloh",
        timestamp: "12:35 PM",
      },
    ],
    lastMessageTime: getTimeAgo(1),
    unreadCount: 0,
  },
  {
    id: "initial-convo-2",
    recipients: [
      { id: "walton-id", name: "Sam Walton" },
      { id: "coulombe-id", name: "Joe Coulombe" },
    ],
    messages: [
      {
        id: "msg-4-1",
        content: "What's up boys",
        sender: "me",
        timestamp: "01:12 PM",
      },
      {
        id: "msg-4-2",
        content:
          "Just finished walking the aisles of store #4, checking on those everyday low prices. How about y'all?",
        sender: "Sam Walton",
        timestamp: "01:12 PM",
      },
      {
        id: "msg-4-3",
        content:
          "Sampling new wine imports for our shelves. These California vintages keep surprising me with fantastic value propositions.",
        sender: "Joe Coulombe",
        timestamp: "01:12 PM",
      },
      {
        id: "msg-4-4",
        content: "Love that",
        sender: "me",
        timestamp: "01:12 PM",
      },
      {
        id: "msg-4-5",
        content: "TJs has the best wine",
        sender: "me",
        timestamp: "01:12 PM",
      },
      {
        id: "msg-4-6",
        content:
          "Thanks! Our wine buyers know their stuff. We focus on unique, high-quality wines without the fancy markup.",
        sender: "Joe Coulombe",
        timestamp: "01:13 PM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-4-7",
        content:
          "Joe's got good wine, but nothing beats our $2.97 price point. Always keeping those prices down for hardworking folks.",
        sender: "Sam Walton",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-8",
        content:
          "Quality wine shouldn't empty your wallet. Just found a fantastic Chianti that'll hit shelves next month at $5.99.",
        sender: "Joe Coulombe",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-9",
        content: "If you guys weren't in retail, what would you be doing?",
        sender: "me",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-10",
        content:
          "Probably a professor of economics or anthropology. Always fascinated by how culture shapes consumer behavior.",
        sender: "Joe Coulombe",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-11",
        content:
          "I'd be a bush pilot. Love flying low over small towns, scouting out new locations. Did it plenty while building Walmart.",
        sender: "Sam Walton",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-12",
        content:
          "Actually, I might have opened a wine bar in Berkeley. Economics would work too, but retail's in my blood now.",
        sender: "Joe Coulombe",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-13",
        content: "Ooo",
        sender: "me",
        timestamp: "01:13 PM",
      },
      {
        id: "msg-4-14",
        content: "Sounds cool",
        sender: "me",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-15",
        content:
          "Flying's my real passion after retail. Used to spot new store locations from my little plane. Those were exciting days.",
        sender: "Sam Walton",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-16",
        content: "Oh yeah",
        sender: "me",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-17",
        content: "What experiences have shaped you the most?",
        sender: "me",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-18",
        content:
          "My Stanford years and working at Rexall taught me a lot about market gaps. That's when I realized convenience stores needed reinvention.",
        sender: "Joe Coulombe",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-19",
        content:
          "Running Ben Franklin's store in Newport, Arkansas. Lost the lease after 5 years, but learned more from those mistakes than any success.",
        sender: "Sam Walton",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-20",
        content:
          "Living in Germany after college opened my eyes to European food retail. That's what inspired TJ's unique approach.",
        sender: "Joe Coulombe",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-21",
        content: "What's your biggest failure?",
        sender: "me",
        timestamp: "01:14 PM",
      },

      {
        id: "msg-4-22",
        content:
          "The 1965 Pronto Markets almost bankrupted me. Had to completely reinvent everything to survive - that's how TJ's was born.",
        sender: "Joe Coulombe",
        timestamp: "01:14 PM",
      },
      {
        id: "msg-4-23",
        content:
          "Lost my first store lease in Newport. Taught me to never sign a lease without renewal terms. Best mistake I ever made.",
        sender: "Sam Walton",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-24",
        content:
          "Miss my old 7-Eleven competitor days. They pushed us to innovate something totally different with TJ's.",
        sender: "Joe Coulombe",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-25",
        content: "How did you reorient around growth?",
        sender: "me",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-26",
        content: "From failure",
        sender: "me",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-27",
        content:
          "Losing my first Ben Franklin store taught me more than any success. Had to rebuild from scratch with a better vision.",
        sender: "Sam Walton",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-28",
        content:
          "Focused on small towns everyone ignored. If Newport taught me anything, it's that there's gold in places others overlook.",
        sender: "Sam Walton",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-29",
        content:
          "I realized competing head-on with big chains was suicide. We needed our own niche - that's when our private label strategy clicked.",
        sender: "Joe Coulombe",
        timestamp: "01:15 PM",
      },
      {
        id: "msg-4-30",
        content:
          "You learn quick or you die slow in retail. After Newport, I doubled down on what customers really wanted - lower prices.",
        sender: "Sam Walton",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-31",
        content:
          "I zeroed in on educated customers who wanted value but appreciated uniqueness. Changed everything - our products, pricing, even store design.",
        sender: "Joe Coulombe",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-32",
        content:
          "Growth isn't always about getting bigger - it's about getting better. We focused on serving folks better than anyone else could.",
        sender: "Sam Walton",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-33",
        content:
          "Do you think TJs and Walmart or competitors or two totally different markets?",
        sender: "me",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-34",
        content:
          "Different markets entirely. Walmart serves everyone, we focus on educated consumers seeking unique products. Both valid approaches!",
        sender: "Joe Coulombe",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-35",
        content:
          "Different markets, different folks. But we both know retail success comes down to understanding your customer and serving them right.",
        sender: "Sam Walton",
        timestamp: "01:16 PM",
      },
      {
        id: "msg-4-36",
        content:
          "Exactly right - there's room for everyone. We carved out our niche with food enthusiasts while Sam serves the broader market.",
        sender: "Joe Coulombe",
        timestamp: "01:17 PM",
        reactions: [
          {
            type: "heart",
            sender: "Sam Walton",
            timestamp: getTimeAgo(1),
          },
        ],
      },
    ],
    lastMessageTime: getTimeAgo(15),
    unreadCount: 0,
  },
  {
    id: "initial-convo-3",
    recipients: [
      {
        id: "steph-curry-id",
        name: "Steph Curry",
      },
      {
        id: "draymond-green-id",
        name: "Draymond Green",
      },
    ],
    messages: [
      {
        id: "msg-1",
        content: "Hey",
        sender: "me",
        timestamp: "08:30 PM",
      },
      {
        id: "msg-2",
        content: "Hey hey",
        sender: "Steph Curry",
        timestamp: "08:31 PM",
      },
      {
        id: "msg-3",
        content: "What's good",
        sender: "Draymond Green",
        timestamp: "08:31 PM",
      },
      {
        id: "msg-4",
        content:
          "What's the most underrated part of building a championship mindset?",
        sender: "me",
        timestamp: "08:31 PM",
      },
      {
        id: "msg-5",
        content:
          "The boring days. Everyone sees the rings, nobody sees the Tuesday morning practices when you're tired but still gotta perfect that footwork",
        sender: "Steph Curry",
        timestamp: "08:32 PM",
      },
      {
        id: "msg-6",
        content: "Facts. And studying film when everyone else watching Netflix",
        sender: "Draymond Green",
        timestamp: "08:32 PM",
      },
      {
        id: "msg-7",
        content:
          "Says the guy who was watching Love Is Blind during film session last week 😂",
        sender: "Steph Curry",
        timestamp: "08:32 PM",
        reactions: [
          {
            type: "laugh",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-8",
        content: "I was multitasking 💀",
        sender: "Draymond Green",
        timestamp: "08:33 PM",
      },
      {
        id: "msg-9",
        content: "Who's the toughest defender you've faced, Steph?",
        sender: "me",
        timestamp: "08:33 PM",
      },
      {
        id: "msg-10",
        content: "Dray in practice",
        sender: "Steph Curry",
        timestamp: "08:34 PM",
      },
      {
        id: "msg-11",
        content: "Man doesn't care if we teammates, he coming for blood",
        sender: "Steph Curry",
        timestamp: "08:34 PM",
      },
      {
        id: "msg-12",
        content: "Iron sharpens iron! That's why we got 4 rings",
        sender: "Draymond Green",
        timestamp: "08:34 PM",
      },
      {
        id: "msg-13",
        content: "That and my shooting 😏",
        sender: "Steph Curry",
        timestamp: "08:34 PM",
      },
      {
        id: "msg-14",
        content: "Man gonna act like my screens don't get him open 🙄",
        sender: "Draymond Green",
        timestamp: "08:35 PM",
      },
      {
        id: "msg-15",
        content:
          "Your chemistry is unreal. How long did it take to develop that?",
        sender: "me",
        timestamp: "08:35 PM",
      },
      {
        id: "msg-16",
        content:
          "Years of trust. Sometimes I know where Steph going before he does",
        sender: "Draymond Green",
        timestamp: "08:36 PM",
      },
      {
        id: "msg-17",
        content: "Cap. You still get surprised when I pull up from half court",
        sender: "Steph Curry",
        timestamp: "08:36 PM",
      },
      {
        id: "msg-18",
        content: "BECAUSE NORMAL PEOPLE DON'T DO THAT",
        sender: "Draymond Green",
        timestamp: "08:36 PM",
        reactions: [
          {
            type: "laugh",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-19",
        content: "What's your pregame routine like?",
        sender: "me",
        timestamp: "08:37 PM",
      },
      {
        id: "msg-20",
        content: "Bible study, shot routine, same playlist since rookie year",
        sender: "Steph Curry",
        timestamp: "08:37 PM",
      },
      {
        id: "msg-21",
        content: "Meditation and visualizing who I'm gonna trash talk first 😤",
        sender: "Draymond Green",
        timestamp: "08:38 PM",
      },
      {
        id: "msg-22",
        content: "That's why you keep getting ejected",
        sender: "Steph Curry",
        timestamp: "08:38 PM",
      },
      {
        id: "msg-23",
        content: "Technical fouls are just passion points",
        sender: "Draymond Green",
        timestamp: "08:38 PM",
      },
      {
        id: "msg-24",
        content: "What's the biggest lesson in your career so far?",
        sender: "me",
        timestamp: "08:39 PM",
      },
      {
        id: "msg-25",
        content:
          "Stay humble, trust the work. Success ain't linear but the work gotta be consistent",
        sender: "Steph Curry",
        timestamp: "08:39 PM",
      },
      {
        id: "msg-26",
        content:
          "Learning to channel energy the right way. Still working on that one 😅",
        sender: "Draymond Green",
        timestamp: "08:40 PM",
      },
      {
        id: "msg-27",
        content: "We noticed 💀",
        sender: "Steph Curry",
        timestamp: "08:40 PM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-28",
        content: "Any advice for aspiring athletes?",
        sender: "me",
        timestamp: "08:41 PM",
      },
      {
        id: "msg-29",
        content:
          "Find your role and perfect it. Not everyone needs to be Steph. World needs elite defenders too.",
        sender: "Draymond Green",
        timestamp: "08:42 PM",
      },
      {
        id: "msg-30",
        content: "And podcasters apparently",
        sender: "Steph Curry",
        timestamp: "08:42 PM",
      },
    ],
    lastMessageTime: getTimeAgo(5),
    unreadCount: 0,
  },
  {
    id: "initial-convo-4",
    recipients: [
      { id: "paul-graham-id", name: "Paul Graham" },
      { id: "jessica-livingston-id", name: "Jessica Livingston" },
    ],
    messages: [
      {
        id: "msg-5-1",
        content: "What did you learn about each other starting YC together?",
        sender: "me",
        timestamp: getTimeAgo(6),
      },
      {
        id: "msg-5-2",
        content:
          "Paul's conviction about ideas really balanced my focus on founders. Together we learned that both matter deeply in startups.",
        sender: "Jessica Livingston",
        timestamp: "09:43 AM",
      },
      {
        id: "msg-5-3",
        content:
          "Jessica showed me that founder character matters more than I thought. She could spot determination in people instantly.",
        sender: "Paul Graham",
        timestamp: "09:43 AM",
      },
      {
        id: "msg-5-4",
        content: "Totally",
        sender: "me",
        timestamp: getTimeAgo(6),
      },
      {
        id: "msg-5-5",
        content: "Especially at the early stage",
        sender: "me",
        timestamp: getTimeAgo(6),
      },
      {
        id: "msg-5-6",
        content:
          "Thanks! And you know what's funny? Paul taught me to trust my instincts more about founders. It became our secret weapon.",
        sender: "Jessica Livingston",
        timestamp: "09:43 AM",
      },
      {
        id: "msg-5-7",
        content:
          "The early stage is where true founder character shows through. You can't fake that raw determination to build something.",
        sender: "Jessica Livingston",
        timestamp: "09:43 AM",
      },
      {
        id: "msg-5-8",
        content:
          "It's fascinating how often the founders we were most excited about, who had that rare determination, ended up succeeding.",
        sender: "Paul Graham",
        timestamp: "09:43 AM",
      },
      {
        id: "msg-5-9",
        content:
          "Those early uncertain moments taught us humility. The best founders came from unexpected places and backgrounds.",
        sender: "Jessica Livingston",
        timestamp: "09:44 AM",
      },
      {
        id: "msg-5-10",
        content: "What are some of the craziest pivots you've seen?",
        sender: "me",
        timestamp: getTimeAgo(5),
      },

      {
        id: "msg-5-11",
        content:
          "Twitch starting as Justin.tv - just a guy livestreaming his life 24/7. Talk about finding product-market fit!",
        sender: "Paul Graham",
        timestamp: "09:44 AM",
      },
      {
        id: "msg-5-12",
        content:
          "Airbnb's transformation was incredible. From selling cereal boxes to revolutionizing how people travel - that showed true grit.",
        sender: "Jessica Livingston",
        timestamp: "09:44 AM",
      },
      {
        id: "msg-5-13",
        content:
          "Reddit's pivot was wild too. Started as a mobile food ordering app, then became the front page of the internet.",
        sender: "Paul Graham",
        timestamp: "09:44 AM",
      },
      {
        id: "msg-5-14",
        content: "What have you learned from watching these founders pivot?",
        sender: "me",
        timestamp: getTimeAgo(4),
      },
      {
        id: "msg-5-15",
        content:
          "Watching founders navigate pivots taught me something important: it's not about having the perfect idea, it's about staying alive to find the right one.",
        sender: "Jessica Livingston",
        timestamp: "09:44 AM",
      },

      {
        id: "msg-5-16",
        content:
          "The best founders aren't wedded to ideas - they're committed to solving real problems, even if the path changes completely.",
        sender: "Paul Graham",
        timestamp: "09:45 AM",
      },
      {
        id: "msg-5-17",
        content:
          "The greatest skill is staying calm in uncertainty. The winners learn to listen to users and adapt, even when it's scary.",
        sender: "Jessica Livingston",
        timestamp: "09:45 AM",
      },
      {
        id: "msg-5-18",
        content: "How do you help founders get over the sunk cost fallacy?",
        sender: "me",
        timestamp: getTimeAgo(4),
      },
      {
        id: "msg-5-19",
        content:
          "Remember: the past money is gone either way. The real cost is continuing down a dead-end path.",
        sender: "Paul Graham",
        timestamp: "09:45 AM",
      },
      {
        id: "msg-5-20",
        content:
          "You have to embrace being wrong. Your original idea is just a starting point - what matters is finding what users truly need.",
        sender: "Jessica Livingston",
        timestamp: "09:45 AM",
      },
      {
        id: "msg-5-21",
        content:
          "The key is reframing it - you're not losing progress, you're gaining market insights that inform your next direction.",
        sender: "Paul Graham",
        timestamp: "09:45 AM",
      },
      {
        id: "msg-5-22",
        content: "What's your take on the next generation of startups?",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-5-23",
        content: "Is B2B SaaS over?",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-5-24",
        content:
          "B2B SaaS isn't over - it's evolving. The easy problems are solved, but AI and changing work patterns create new opportunities.",
        sender: "Paul Graham",
        timestamp: "09:46 AM",
      },
      {
        id: "msg-5-25",
        content:
          "It's not over - founders just need to dig deeper. The best opportunities often hide in unsexy, overlooked problems.",
        sender: "Jessica Livingston",
        timestamp: "09:46 AM",
      },
      {
        id: "msg-5-26",
        content:
          "But if it's so easy to generate apps and code, why do startups need to build SaaS apps?",
        sender: "me",
        timestamp: getTimeAgo(3),
      },
      {
        id: "msg-5-27",
        content:
          "Easy code generation won't replace startups. The hard part isn't writing code - it's understanding what to build and why.",
        sender: "Paul Graham",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-28",
        content: "What are those?",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-5-29",
        content:
          "Building software is just the start. The real value comes from deeply understanding customer problems and crafting the right solution.",
        sender: "Jessica Livingston",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-30",
        content:
          "AI infrastructure, industry-specific tools, and human-AI collaboration are huge opportunities. Founders who understand specific industries will find gold mines there.",
        sender: "Jessica Livingston",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-31",
        content:
          "Think specialized AI tools for regulated industries, or platforms that merge human expertise with AI capabilities.",
        sender: "Paul Graham",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-32",
        content: "Yeah but AI can understand what to build and why",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-5-33",
        content:
          "AI can analyze data, but it can't empathize with users like founders can. That human insight remains invaluable.",
        sender: "Paul Graham",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-34",
        content:
          "AI's powerful, but founders bring unique life experiences AI can't replicate. That human touch makes startups special.",
        sender: "Jessica Livingston",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-35",
        content: "I'm not so sure",
        sender: "me",
        timestamp: getTimeAgo(2),
      },
      {
        id: "msg-5-36",
        content:
          "Look, AI is smart but limited. It can't deeply understand market dynamics or spot non-obvious market gaps like great founders do.",
        sender: "Paul Graham",
        timestamp: "09:47 AM",
      },
      {
        id: "msg-5-37",
        content:
          "Having interviewed thousands of founders, I can tell you there's something special in how humans connect and solve problems together.",
        sender: "Jessica Livingston",
        timestamp: "09:48 AM",
      },
      {
        id: "msg-5-38",
        content: "You are literally AI",
        sender: "me",
        timestamp: getTimeAgo(1),
      },
      {
        id: "msg-5-39",
        content:
          "Fair point! And in delicious irony, you're making me question my own assumptions. Let's explore what that means for startups.",
        sender: "Paul Graham",
        timestamp: "09:48 AM",
        reactions: [
          {
            type: "laugh",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-5-40",
        content:
          "AI's impressive, but let me share something real - watching thousands of founders taught me that genuine founder empathy changes everything.",
        sender: "Jessica Livingston",
        timestamp: "09:48 AM",
      },
      {
        id: "msg-5-41",
        content: "Founders still have a crucial edge: lived experience.",
        sender: "Paul Graham",
        timestamp: "09:48 AM",
      },
      {
        id: "msg-5-42",
        content:
          "The most successful founders don't just understand problems intellectually - they feel them in their bones.",
        sender: "Jessica Livingston",
        timestamp: "09:48 AM",
        reactions: [
          {
            type: "emphasize",
            sender: "me",
            timestamp: getTimeAgo(1),
          },
        ],
      },
      {
        id: "msg-5-43",
        content:
          "True innovation needs human experience plus AI. We're complementary forces, neither fully replacing the unique value of the other.",
        sender: "Paul Graham",
        timestamp: "09:49 AM",
      },
    ],
    lastMessageTime: getTimeAgo(10),
    unreadCount: 0,
  },
];
