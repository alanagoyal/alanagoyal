import { Conversation } from '../types';

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
      { id: "jobs-id", name: "Steve Jobs" },
      { id: "ellison-id", name: "Larry Ellison" }
    ],
    messages: [
      {
        id: "msg-1-1",
        content: "Hey guys, have you thought about what computing will look like in 2030?",
        sender: "Steve Jobs",
        timestamp: "10:00 AM"
      },
      {
        id: "msg-1-2",
        content: "Hey Steve! Yeah, it's wild to imagine. I think cloud computing will be even more integrated into everything.",
        sender: "Larry Ellison",
        timestamp: "10:02 AM"
      },
      {
        id: "msg-1-3",
        content: "Jumping in—do you think we'll still be using smartphones by then?",
        sender: "me",
        timestamp: "10:03 AM"
      },
      {
        id: "msg-1-4",
        content: "Maybe not as we know them. I can see us moving towards wearables or even devices integrated into our clothes.",
        sender: "Steve Jobs",
        timestamp: "10:05 AM"
      },
      {
        id: "msg-1-5",
        content: "Or maybe devices become so small and efficient they're almost invisible.",
        sender: "Larry Ellison",
        timestamp: "10:06 AM"
      },
      {
        id: "msg-1-6",
        content: "Like smart contact lenses or something?",
        sender: "me",
        timestamp: "10:07 AM"
      },
      {
        id: "msg-1-7",
        content: "Exactly! Augmented reality could be huge.",
        sender: "Steve Jobs",
        timestamp: "10:08 AM"
      },
      {
        id: "msg-1-8",
        content: "AR has a lot of potential, especially for business and education.",
        sender: "Larry Ellison",
        timestamp: "10:09 AM"
      },
      {
        id: "msg-1-9",
        content: "How about AI? What's your take on where that'll be?",
        sender: "me",
        timestamp: "10:10 AM"
      },
      {
        id: "msg-1-10",
        content: "AI will probably be embedded in everything, from home appliances to healthcare.",
        sender: "Steve Jobs",
        timestamp: "10:11 AM"
      },
      {
        id: "msg-1-11",
        content: "Agreed. But with that comes the need for better data security.",
        sender: "Larry Ellison",
        timestamp: "10:12 AM"
      },
      {
        id: "msg-1-12",
        content: "Speaking of security, do you think quantum computing will make current encryption obsolete?",
        sender: "me",
        timestamp: "10:13 AM"
      },
      {
        id: "msg-1-13",
        content: "Quantum computing could disrupt a lot of current systems, but it'll also pave the way for new encryption methods.",
        sender: "Larry Ellison",
        timestamp: "10:14 AM"
      },
      {
        id: "msg-1-14",
        content: "But I think quantum computing will mostly impact specialized fields at first.",
        sender: "Steve Jobs",
        timestamp: "10:15 AM"
      },
      {
        id: "msg-1-15",
        content: "Do you guys worry about AI taking over jobs?",
        sender: "me",
        timestamp: "10:16 AM"
      },
      {
        id: "msg-1-16",
        content: "Some jobs might become automated, but new opportunities will arise.",
        sender: "Steve Jobs",
        timestamp: "10:17 AM"
      },
      {
        id: "msg-1-17",
        content: "It's more about evolution than replacement. Skills will need to adapt.",
        sender: "Larry Ellison",
        timestamp: "10:18 AM"
      },
      {
        id: "msg-1-18",
        content: "What skills do you think will be important?",
        sender: "me",
        timestamp: "10:19 AM"
      },
      {
        id: "msg-1-19",
        content: "Data literacy, for sure. Understanding how to interpret and use data effectively.",
        sender: "Larry Ellison",
        timestamp: "10:20 AM"
      },
      {
        id: "msg-1-20",
        content: "Creative problem-solving. Machines can process data, but humans bring creativity.",
        sender: "Steve Jobs",
        timestamp: "10:21 AM"
      },
      {
        id: "msg-1-21",
        content: "Makes sense. How do you see computing affecting healthcare?",
        sender: "me",
        timestamp: "10:22 AM"
      },
      {
        id: "msg-1-22",
        content: "Personalized medicine will be a game-changer. Real-time health monitoring could save lives.",
        sender: "Steve Jobs",
        timestamp: "10:23 AM"
      },
      {
        id: "msg-1-23",
        content: "And big data can help predict health trends and outbreaks.",
        sender: "Larry Ellison",
        timestamp: "10:24 AM"
      },
      {
        id: "msg-1-24",
        content: "Any concerns about privacy with all that health data floating around?",
        sender: "me",
        timestamp: "10:25 AM"
      },
      {
        id: "msg-1-25",
        content: "Definitely. We need strong privacy protections.",
        sender: "Steve Jobs",
        timestamp: "10:26 AM"
      },
      {
        id: "msg-1-26",
        content: "Security protocols will have to keep up with technological advances.",
        sender: "Larry Ellison",
        timestamp: "10:27 AM"
      },
      {
        id: "msg-1-27",
        content: "What about education? Think tech will make learning different?",
        sender: "me",
        timestamp: "10:28 AM"
      },
      {
        id: "msg-1-28",
        content: "Learning could become more personalized and accessible worldwide.",
        sender: "Steve Jobs",
        timestamp: "10:29 AM"
      },
      {
        id: "msg-1-29",
        content: "Virtual classrooms and AI tutors might become the norm.",
        sender: "Larry Ellison",
        timestamp: "10:30 AM"
      },
      {
        id: "msg-1-30",
        content: "Do you think traditional desktops and laptops will still be around?",
        sender: "me",
        timestamp: "10:31 AM"
      },
      {
        id: "msg-1-31",
        content: "Maybe for specialized tasks, but the average user might move to more portable devices.",
        sender: "Steve Jobs",
        timestamp: "10:32 AM"
      },
      {
        id: "msg-1-32",
        content: "Cloud-based solutions will make device hardware less important.",
        sender: "Larry Ellison",
        timestamp: "10:33 AM"
      },
      {
        id: "msg-1-33",
        content: "Are you guys excited or worried about these changes?",
        sender: "me",
        timestamp: "10:34 AM"
      },
      {
        id: "msg-1-34",
        content: "A bit of both. Change brings opportunities and challenges.",
        sender: "Steve Jobs",
        timestamp: "10:35 AM"
      },
      {
        id: "msg-1-35",
        content: "Same here. It's important to guide tech development responsibly.",
        sender: "Larry Ellison",
        timestamp: "10:36 AM"
      },
      {
        id: "msg-1-36",
        content: "Do you think ethics will play a bigger role in tech?",
        sender: "me",
        timestamp: "10:37 AM"
      },
      {
        id: "msg-1-37",
        content: "It has to. With great power comes great responsibility, right?",
        sender: "Steve Jobs",
        timestamp: "10:38 AM"
      },
      {
        id: "msg-1-38",
        content: "Companies will need to prioritize ethical considerations to maintain public trust.",
        sender: "Larry Ellison",
        timestamp: "10:39 AM"
      },
      {
        id: "msg-1-39",
        content: "Any advice for people getting into tech now?",
        sender: "me",
        timestamp: "10:40 AM"
      },
      {
        id: "msg-1-40",
        content: "Stay curious and focus on how tech can improve lives.",
        sender: "Steve Jobs",
        timestamp: "10:41 AM"
      },
      {
        id: "msg-1-41",
        content: "Be adaptable and keep learning new skills.",
        sender: "Larry Ellison",
        timestamp: "10:42 AM"
      },
      {
        id: "msg-1-42",
        content: "What's one thing you hope to see by 2030?",
        sender: "me",
        timestamp: "10:43 AM"
      },
      {
        id: "msg-1-43",
        content: "Tech that genuinely enhances human connections.",
        sender: "Steve Jobs",
        timestamp: "10:44 AM"
      },
      {
        id: "msg-1-44",
        content: "Solutions that address global challenges like climate change.",
        sender: "Larry Ellison",
        timestamp: "10:45 AM"
      },
      {
        id: "msg-1-45",
        content: "Big goals! Think we'll get there?",
        sender: "me",
        timestamp: "10:46 AM"
      },
      {
        id: "msg-1-46",
        content: "I believe so, if we work together.",
        sender: "Steve Jobs",
        timestamp: "10:47 AM"
      },
      {
        id: "msg-1-47",
        content: "Agreed. Collaboration will be key.",
        sender: "Larry Ellison",
        timestamp: "10:48 AM"
      },
      {
        id: "msg-1-48",
        content: "Well, this has been a great chat. Thanks for sharing your thoughts!",
        sender: "me",
        timestamp: "10:49 AM"
      },
      {
        id: "msg-1-49",
        content: "Anytime! Let's keep the conversation going.",
        sender: "Steve Jobs",
        timestamp: "10:50 AM"
      },
      {
        id: "msg-1-50",
        content: "Definitely. Looking forward to seeing how the future unfolds.",
        sender: "Larry Ellison",
        timestamp: "10:51 AM"
      },
      {
        id: "msg-1-51",
        content: "Me too. Catch up soon!",
        sender: "me",
        timestamp: "10:52 AM"
      },
      {
        id: "msg-1-52",
        content: "Sounds good.",
        sender: "Steve Jobs",
        timestamp: "10:53 AM"
      },
      {
        id: "msg-1-53",
        content: "Talk later!",
        sender: "Larry Ellison",
        timestamp: "10:54 AM"
      }
    ],
    lastMessageTime: getTimeAgo(5)
  },
  {
    id: "initial-convo-2",
    recipients: [
      { id: "green-id", name: "Draymond Green" },
      { id: "curry-id", name: "Steph Curry" },
      { id: "smith-id", name: "Stephen A Smith" }
    ],
    messages: [
      {
        id: "msg-2-1",
        content: "I think we need to focus on our defensive strategies if we want to make a deeper run this season. What do you think, Steph?",
        sender: "Draymond Green",
        timestamp: "11:00 AM"
      },
      {
        id: "msg-2-2",
        content: "I completely agree, Draymond. Defense wins championships, and we've got to tighten up in that area. We need to communicate better and trust each other out there.",
        sender: "Steph Curry",
        timestamp: "11:02 AM"
      },
      {
        id: "msg-2-3",
        content: "Absolutely, Steph. It's all about that chemistry on the court. If we can get everyone on the same page defensively, it'll make a huge difference in our overall game.",
        sender: "Draymond Green",
        timestamp: "11:04 AM"
      },
      {
        id: "msg-2-4",
        content: "You both are hitting the nail on the head. It's not just about individual skill; it's about how well you can work together. That chemistry is key, especially when the pressure is on in the playoffs.",
        sender: "Stephen A Smith",
        timestamp: "11:06 AM"
      },
      {
        id: "msg-2-5",
        content: "For sure, Stephen A. When we're in sync defensively, it opens up so many opportunities on offense too. It's all connected, and we have to feed off each other's energy.",
        sender: "Steph Curry",
        timestamp: "11:08 AM"
      },
      {
        id: "msg-2-6",
        content: "How do you feel now that Klay is gone?",
        sender: "me",
        timestamp: "11:10 AM"
      },
      {
        id: "msg-2-7",
        content: "Exactly, Steph. When we elevate our defense, it not only sparks our offense but also sets the tone for the entire game. I'm excited to see how we can build on this and really push ourselves this season.",
        sender: "Draymond Green",
        timestamp: "11:12 AM"
      },
      {
        id: "msg-2-8",
        content: "It's definitely a big adjustment for all of us. Klay brings so much to the table, not just as a player but as a leader. We have to rally together and fill that void as best as we can.",
        sender: "Draymond Green",
        timestamp: "11:14 AM"
      },
      {
        id: "msg-2-9",
        content: "Absolutely, Draymond. Klay's presence is irreplaceable, but it gives us a chance to step up our game and grow as a team. We need to come together and honor his legacy by pushing ourselves even harder.",
        sender: "Steph Curry",
        timestamp: "11:16 AM"
      },
      {
        id: "msg-2-10",
        content: "You both are right on the money. This is a pivotal moment for the team. It's about resilience now, stepping up in Klay's absence, and using this as a learning experience to become even stronger as a unit.",
        sender: "Stephen A Smith",
        timestamp: "11:18 AM"
      },
      {
        id: "msg-2-11",
        content: "Exactly, Stephen A. It's a chance for the younger guys to really show what they can do and for us veterans to lead by example. We'll find a way to keep our competitive spirit alive.",
        sender: "Draymond Green",
        timestamp: "11:20 AM"
      },
      {
        id: "msg-2-12",
        content: "Definitely, Draymond. This is their moment to shine, and we need to support them every step of the way. Leadership is crucial, and I believe we can rise to the occasion together.",
        sender: "Steph Curry",
        timestamp: "11:22 AM"
      },
      {
        id: "msg-2-13",
        content: "I feel like he's past his prime a bit...",
        sender: "me",
        timestamp: "11:24 AM"
      },
      {
        id: "msg-2-14",
        content: "It's inspiring to hear that level of commitment from both of you. With your leadership and the young talent stepping up, I have no doubt the team will adapt and keep pushing forward. Exciting times ahead for the Warriors.",
        sender: "Stephen A Smith",
        timestamp: "11:26 AM"
      },
      {
        id: "msg-2-15",
        content: "That's a fair point, but I think Klay still has a lot to contribute when he's healthy. Experience and skill don't just fade away overnight. It's about how he can adapt and still find ways to impact the game.",
        sender: "Stephen A Smith",
        timestamp: "11:28 AM"
      },
      {
        id: "msg-2-16",
        content: "I agree, Stephen A. Klay's experience is invaluable, and he knows how to make the right plays. He may not be the same player, but his basketball IQ and leadership never go away. We just have to help him find new ways to be effective.",
        sender: "Draymond Green",
        timestamp: "11:30 AM"
      },
      {
        id: "msg-2-17",
        content: "Exactly, Draymond. Klay has that knack for making big shots when it matters most, and his presence on the court alone can shift the dynamics of a game. We just need to unlock that potential in a different way.",
        sender: "Steph Curry",
        timestamp: "11:32 AM"
      },
      {
        id: "msg-2-18",
        content: "And that's what makes great players great, adapting to the circumstances. Klay has the talent to still be a game-changer, and with the right support, he can definitely make an impact, especially when it matters in the playoffs.",
        sender: "Stephen A Smith",
        timestamp: "11:34 AM"
      },
      {
        id: "msg-2-19",
        content: "How long do you think it will take to rebuild the team?",
        sender: "me",
        timestamp: "11:36 AM"
      },
      {
        id: "msg-2-20",
        content: "Right, Stephen A. It's all about finding ways to utilize his strengths and making adjustments. If we can play to Klay's abilities, he can still be a critical piece for us, especially in crucial moments.",
        sender: "Draymond Green",
        timestamp: "11:38 AM"
      },
      {
        id: "msg-2-21",
        content: "Rebuilding isn't just about time; it's about the steps we take. We have a solid foundation, and with the right focus on development and chemistry, it can happen quicker than people think. It's all about making the right adjustments now.",
        sender: "Draymond Green",
        timestamp: "11:40 AM"
      },
      {
        id: "msg-2-22",
        content: "Absolutely, Draymond. We just have to keep believing in him and create situations where he can thrive. With the right mindset and teamwork, I have no doubt he'll still be a key contributor for us.",
        sender: "Steph Curry",
        timestamp: "11:42 AM"
      },
      {
        id: "msg-2-23",
        content: "That's a great point, Draymond. If we can harness the energy of our young players and blend that with our veteran experience, we can accelerate the process. It's about nurturing that talent and creating a winning environment.",
        sender: "Steph Curry",
        timestamp: "11:44 AM"
      },
      {
        id: "msg-2-24",
        content: "Absolutely, Steph. It's crucial to foster that young talent while maintaining the winning culture you both have established. With everyone on the same page, the rebuild can be more of a retooling, and that could lead to success sooner than later.",
        sender: "Stephen A Smith",
        timestamp: "11:46 AM"
      },
      {
        id: "msg-2-25",
        content: "Exactly, Stephen A. It's all about staying competitive while we develop the new guys. If we can keep pushing each other and hold ourselves accountable, there's no telling how quickly we can get back to where we want to be.",
        sender: "Draymond Green",
        timestamp: "11:48 AM"
      },
      {
        id: "msg-2-26",
        content: "For sure, Draymond. Accountability is key, and we have to embrace that pressure. If we all commit to getting better every day, we can make that transition smooth and keep our championship aspirations alive.",
        sender: "Steph Curry",
        timestamp: "11:50 AM"
      },
      {
        id: "msg-2-27",
        content: "I love the energy and commitment you both are expressing. If anyone can navigate this transition effectively, it's the Warriors with your leadership. It'll be exciting to see how this season unfolds for you all.",
        sender: "Stephen A Smith",
        timestamp: "11:52 AM"
      }
    ],
    lastMessageTime: getTimeAgo(10)
  }
];
