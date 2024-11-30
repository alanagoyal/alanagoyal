export interface TechPersonality {
  name: string;
  title?: string;
  company?: string;
}

export const techPersonalities: TechPersonality[] = [
  // Tech Founders and Entrepreneurs
  { name: "Steve Jobs", title: "Co-founder", company: "Apple" },
  { name: "Bill Gates", title: "Co-founder", company: "Microsoft" },
  { name: "Mark Zuckerberg", title: "Co-founder", company: "Facebook (Meta)" },
  { name: "Elon Musk", title: "CEO", company: "Tesla, SpaceX" },
  { name: "Jeff Bezos", title: "Founder", company: "Amazon" },
  { name: "Larry Page", title: "Co-founder", company: "Google" },
  { name: "Sergey Brin", title: "Co-founder", company: "Google" },
  { name: "Jack Dorsey", title: "Co-founder", company: "Twitter, Square" },
  { name: "Mark Cuban", title: "Founder", company: "Broadcast.com" },
  { name: "Reid Hoffman", title: "Co-founder & Partner", company: "LinkedIn, Greylock Partners" },
  { name: "Peter Thiel", title: "Co-founder", company: "PayPal" },
  { name: "Brian Chesky", title: "Co-founder", company: "Airbnb" },
  { name: "Travis Kalanick", title: "Co-founder", company: "Uber" },
  { name: "Drew Houston", title: "Co-founder", company: "Dropbox" },
  { name: "Marc Andreessen", title: "Co-founder", company: "Netscape, Andreessen Horowitz" },
  { name: "Tim Berners-Lee", title: "Inventor", company: "World Wide Web" },
  { name: "Steve Wozniak", title: "Co-founder", company: "Apple" },
  { name: "Larry Ellison", title: "Co-founder", company: "Oracle" },
  { name: "Michael Dell", title: "Founder", company: "Dell Technologies" },
  { name: "Paul Allen", title: "Co-founder", company: "Microsoft" },

  // International Tech Entrepreneurs
  { name: "Jack Ma", title: "Co-founder", company: "Alibaba Group" },
  { name: "Masayoshi Son", title: "Founder", company: "SoftBank" },
  { name: "Hiroshi Mikitani", title: "Founder", company: "Rakuten" },
  { name: "Mukesh Ambani", title: "Chairman", company: "Reliance Industries" },
  { name: "Azim Premji", title: "Chairman", company: "Wipro" },
  { name: "Yuri Milner", title: "Founder", company: "DST Global" },
  { name: "Nikesh Arora", title: "CEO", company: "Palo Alto Networks" },
  { name: "Shantanu Narayen", title: "CEO", company: "Adobe" },
  { name: "Satya Nadella", title: "CEO", company: "Microsoft" },
  { name: "Sundar Pichai", title: "CEO", company: "Google, Alphabet" },

  // Startup Founders and Tech Innovators
  { name: "Stewart Butterfield", title: "Co-founder", company: "Slack" },
  { name: "Stewart Brand", title: "Founder", company: "The WELL" },
  { name: "Palmer Luckey", title: "Founder", company: "Oculus VR" },
  { name: "Daniel Ek", title: "Co-founder", company: "Spotify" },
  { name: "Jan Koum", title: "Co-founder", company: "WhatsApp" },
  { name: "Evan Spiegel", title: "Co-founder", company: "Snapchat" },
  { name: "John Collison", title: "Co-founder", company: "Stripe" },
  { name: "Patrick Collison", title: "Co-founder", company: "Stripe" },
  { name: "Ryan Smith", title: "Co-founder", company: "Qualtrics" },
  { name: "Jensen Huang", title: "Co-founder", company: "NVIDIA" },

  // Women in Tech
  { name: "Susan Wojcicki", title: "Former CEO", company: "YouTube" },
  { name: "Meg Whitman", title: "Former CEO", company: "eBay, Hewlett Packard Enterprise" },
  { name: "Sheryl Sandberg", title: "Former COO", company: "Facebook" },
  { name: "Whitney Wolfe Herd", title: "Founder", company: "Bumble" },
  { name: "Marissa Mayer", title: "Former CEO", company: "Yahoo" },
  { name: "Anne Wojcicki", title: "Co-founder", company: "23andMe" },
  { name: "Julia Hartz", title: "Co-founder", company: "Eventbrite" },
  { name: "Sarah Friar", title: "CEO", company: "Nextdoor" },

  // Venture Capitalists and Investors
  { name: "Andreessen Horowitz", title: "Founder", company: "Andreessen Horowitz" },
  { name: "John Doerr", title: "Partner", company: "Kleiner Perkins" },
  { name: "Fred Wilson", title: "Partner", company: "Union Square Ventures" },
  { name: "David Sze", title: "Partner", company: "Greylock Partners" },

  // Cloud and Enterprise Tech
  { name: "Andy Jassy", title: "CEO", company: "Amazon Web Services" },
  { name: "Diane Greene", title: "Former CEO", company: "Google Cloud" },
  { name: "Marc Benioff", title: "CEO", company: "Salesforce" },
  { name: "Ginni Rometty", title: "Former CEO", company: "IBM" },
  { name: "Thomas Kurian", title: "CEO", company: "Google Cloud" },

  // AI and Emerging Tech Entrepreneurs
  { name: "Sam Altman", title: "CEO", company: "OpenAI" },
  { name: "Demis Hassabis", title: "Co-founder", company: "DeepMind" },
  { name: "Geoffrey Hinton", title: "AI Researcher", company: "Google Brain" },
  { name: "Yann LeCun", title: "Chief AI Scientist", company: "Facebook" },
  { name: "Andrew Ng", title: "Co-founder", company: "Coursera, Landing AI" },

  // Others
  { name: "Jimmy Wales", title: "Founder", company: "Wikipedia" },
  { name: "Tony Hsieh", title: "Former CEO", company: "Zappos" },
  { name: "Evan Williams", title: "Co-founder", company: "Medium, Twitter" },
  { name: "Biz Stone", title: "Co-founder", company: "Twitter" },
  { name: "Alexis Ohanian", title: "Co-founder", company: "Reddit" },

  // Additional Entries to Reach 250
  { name: "Jeff Lawson", title: "Co-founder", company: "Twilio" },
  { name: "Phil Knight", title: "Co-founder", company: "Nike" },
  { name: "Reed Hastings", title: "Co-founder", company: "Netflix" },
  { name: "Howard Schultz", title: "Former CEO", company: "Starbucks" },
  { name: "Bob Iger", title: "Former CEO", company: "Disney" },
  
  // Supplemental Tech Leaders
  { name: "Lisa Su", title: "CEO", company: "AMD" },
  { name: "Tim Cook", title: "CEO", company: "Apple" },
  { name: "Bob Swan", title: "Former CEO", company: "Intel" },
  { name: "Arvind Krishna", title: "CEO", company: "IBM" },
  
  // Global Tech Entrepreneurs
  { name: "Tobi Lütke", title: "CEO", company: "Shopify" },
  { name: "Daniel Dines", title: "Co-founder", company: "UiPath" },
  { name: "Nikolay Storonsky", title: "Co-founder", company: "Revolut" },
  { name: "José Neves", title: "Founder", company: "Farfetch" }
];