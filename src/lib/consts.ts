export const appName = process.env.NEXT_PUBLIC_APP_NAME;

const ONE_HOUR_IN_MS = 1000 * 60 * 60;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

//    FILES    //
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const CHUNK_SIZE = 3 * 1024 * 1024; // 3MB

//    DATA-FETCHING    //
export const NOTES_STATS_FETCHING_INTERVAL = ONE_HOUR_IN_MS * 12; // 12 hours
export const NOTES_FETCHING_INTERVAL = ONE_HOUR_IN_MS * 12; // 12 hours

// Two weeks ago
export const NOTES_STATS_FETCHING_EARLIEST_DATE = new Date(
  Date.now() - 14 * ONE_DAY_IN_MS,
);

export const MIN_EXTENSION_TO_UPLOAD_LINK = "1.3.98";

// Date range constants for notes stats
export const DATE_RANGE_OPTIONS = {
  LAST_7_DAYS: "last_7_days",
  LAST_30_DAYS: "last_30_days",
  LAST_90_DAYS: "last_90_days",
  ALL_TIME: "all_time",
  CUSTOM: "custom",
} as const;

export type DateRangeOption =
  (typeof DATE_RANGE_OPTIONS)[keyof typeof DATE_RANGE_OPTIONS];

export const DATE_RANGE_LABELS: Record<DateRangeOption, string> = {
  [DATE_RANGE_OPTIONS.LAST_7_DAYS]: "Last 7 days",
  [DATE_RANGE_OPTIONS.LAST_30_DAYS]: "Last 30 days",
  [DATE_RANGE_OPTIONS.LAST_90_DAYS]: "Last 90 days",
  [DATE_RANGE_OPTIONS.ALL_TIME]: "All time",
  [DATE_RANGE_OPTIONS.CUSTOM]: "Custom",
};

// Helper function to get date range based on option
export const getDateRangeFromOption = (
  option: DateRangeOption,
  customRange?: { from: Date; to: Date },
) => {
  const now = new Date();

  switch (option) {
    case DATE_RANGE_OPTIONS.LAST_7_DAYS:
      return {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
    case DATE_RANGE_OPTIONS.LAST_30_DAYS:
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
    case DATE_RANGE_OPTIONS.LAST_90_DAYS:
      return {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
    case DATE_RANGE_OPTIONS.ALL_TIME:
      return {
        startDate: new Date("2020-01-01"), // Far back date to include all notes
        endDate: now,
      };
    case DATE_RANGE_OPTIONS.CUSTOM:
      return customRange
        ? {
            startDate: customRange.from,
            endDate: customRange.to,
          }
        : {
            startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            endDate: now,
          };
    default:
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
      };
  }
};

export const testimonials = [
  {
    quote: `I found ${appName} via Substack.

    It's a great product and easy to use. It takes all the best features of other scheduling apps and puts them in one place.
    <br/><br/>
    Right now it's the only Substack scheduler there is. The team works hard on it and I would recommend to anyone who wants to take Substack seriously.
    <br/><br/>
    Seeing top posts is a gamechanger as well.
    <br/><br/>
    Effortless to get started. I recommend you start with the "queue" page
    `,
    bestSeller: "100",
    author: "Tim Denning",
    image: "/tim-denning.jpg",
    title: "Author of Unfiltered by Tim Denning",
    url: "https://substack.com/@timdenning",
  },
  {
    noteImage: "/testimonials/anton-testimonial.png",
    noteUrl: "https://substack.com/@antonzaides/note/c-119174331",
    author: "Anton Zaides",
    title: "Author of Manager.dev",
    url: "https://substack.com/@antonzaides",
    image: "/testimonials/anton.webp",
  },
  {
    quote: `WriteStack is my go-to tool for figuring out what's working on Substack—and what isn't. 
    <br/><br/>
    It saves me hours of research and helps me stay ahead of the curve.
    <br/><br/>
    Orel has really helpful and always looking to improve WriteStack.
`,
    author: "Philip Hofmacher",
    bestSeller: "100",
    image:
      "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdc125fa8-cfe4-438f-9b30-375d783f944b_865x865.jpeg",
    title: "Author of Write Build Scale<br/>",
    url: "https://substack.com/@philiphofmacher",
  },
  {
    quote: `${appName} is an amazing tool for any Substack writers who want to take some of the pain out of growing on the platform.
   <br/><br/>
   It's easy to use, very intuative and constantly improving.
   <br/>If you want to build a Substack audience on a daily basis without the hassle (and have fun in the process), you need to try ${appName}.
   <br/><br/>
   <strong>Highly recommended!</strong>
`,
    author: "David McIlroy",
    bestSeller: "100",
    image: "/testimonials/david-mcilroy.jpg",
    title: "Writer of How to Write for a Living<br/>",
    url: "https://substack.com/@thedavidmcilroy",
  },
  {
    quote: `${appName} allowed me to finally find my voice on Substack Notes, one that I'm satisfied with and I feel like. 
      <br/><br/> It resonates with readers.
      <br/><br/> It's also extremely easy to use, so it lets me post multiple notes a day, even if I have little to no time`,
    author: "Kacper Wojaczek",
    image: "/testimonials/kacper-wojaczek.png",
    title: "Author of Scramble IT",
    url: "https://substack.com/@kacperwojaczek",
  },
  {
    quote: `WriteStack transformed my experience on Notes with its scheduling tools.
    <br/><br/>
    It's easy to use, and Orel is exceptionally fast at responding to issues.
    <br/><br/>
    Since using WriteStack, I've seen consistent growth in engagement, and have actually enjoyed the process of planning my content calendar.
    <br/><br/>
    <strong>Recommended for any serious Notes creator!</strong>`,
    author: "Rasmus Edwards",
    image: "/testimonials/rasmus-edwards.webp",
    title: "Author of Solo Dev Saturday",
    url: "https://substack.com/@rasmusedwards",
  },
  {
    quote: `${appName} is incredibly thoughtful.
    <br/><br/>
    The notes scheduler keeps me consistent, and the outline generator is pure genius. 
    <br/><br/>
    It takes the pressure off starting from scratch and makes publishing feel easy.`,
    author: "Tam Nguyen",
    image: "/testimonials/tam-nguyen.jpg",
    title: "Author of Simply AI",
    url: "https://substack.com/@techwithtam",
  },
  {
    quote: `What makes Writestack stand out for me isn't just how deep the features go, it's that you can tell it's a product shaped by people who actually use it.
    <br/><br/>
    Using it feels more like a creative partnership than just a platform.`,
    author: "Karo (Product with Attitude)",
    image: "/testimonials/karo.png",
    title: "Author of Product with Attitude",
    url: "https://substack.com/@karozieminski",
  },
  {
    author: "Tech Tornado",
    quote: `WriteStack has been a game changer for me.
    <br/><br/>
    As a financial content creator, consistency is everything — and WriteStack helps me show up every day with clarity and structure.
    <br/><br/>
    I finally have a system to publish consistently without burning out.
    <br/><br/>
    — Felix, Founder of The Nasdaq Playbook`,
    image: "/testimonials/tech-tornado.webp",
    title: "Author of The Nasdaq Playbook",
    url: "https://substack.com/@techtornado",
  },
  {
    quote: `I love ${appName}.
    <br/><br/>
    I've been using it to get inspiration for my Substack Notes and it saves me so much time coming up with new ideas.
    <br/><br/>
     I <strong>highly recommend</strong> it to anyone writing daily on Substack.`,
    author: "Mark Willis",
    image: "/testimonials/mark-willis.png",
    title: "Author of Creator's Playbook",
    url: "https://substack.com/@markwils",
  },
  {
    quote: `I found ${appName} right when my workflow was hitting a wall—too bogged down by my daily work, with too little time to post my content.
    <br/><br/>
    ${appName} instantly streamlined my process.
    <br/><br/>
    Scheduling and automation used to be a pain, but now I can queue up Substack Notes in advance and hit my audience at the perfect time, every day.
    <br/><br/>
    Since signing up, I'm posting more consistently, reaching more people, and spending way less time on manual busywork.
    <br/><br/>
    ${appName} has made my publishing life <strong>a lot easier</strong>.
    <br/><br/>
    Getting started with ${appName} was refreshingly simple.
    <br/><br/>
    Orel's customer service is next-level—he was on top of every detail and even fixed bugs before I noticed them. The onboarding just worked.
    <br/><br/>
    I'm so glad I found ${appName}.`,
    author: "Stefan G.",
    image: "/testimonials/stefan-girard.webp",
    title: "Author of Frontier Notes for AI Operators",
    url: "https://substack.com/@stfgirard",
  },
  {
    quote: `Writestack is not only the tool I was looking for to improve my presence on Substack, but it has also given me the opportunity to help members of my community grow theirs too.
        <br/><br/>
        Orel is doing an outstanding job democratizing growth on Substack. It's another step forward in giving creators more chances to share our message with the world.`,
    author: "David Domínguez",
    image: "/testimonials/david-dominguez.jpg",
    title: "Author of Crecer en Substack",
    url: "https://substack.com/@daviddominguez",
  },
  {
    noteImage: "/testimonials/alan-testimonial.png",
    noteUrl: "https://substack.com/@legendofalan/note/c-125360659",
    author: "Alan",
    image: "/testimonials/alan.jpg",
    title: "Author of the White Flag",
    url: "https://whiteflag1.substack.com/",
  },
  {
    quote: `My problem isn't a lack of ideas—it's too many.
    <br/><br/>
    Without Writestack, I'd be a hyperactive bunny, constantly posting random thoughts online.
    <br/><br/>
    But it helps me slow down, organize my ideas, and think before I hit publish. 
    <br/><br/>
    I can schedule posts, improve them, delete the ones that don't hold up, or revisit them later with fresh eyes. 
    <br/><br/>
    So I get two major wins: a reliable place to save ideas and space to refine my writing before it goes live.
    <br/><br/>
    Bonus: I'm starting to enjoy the analytics Orel built. I love seeing which notes brought in subscribers—it's helping me understand what tone, style, and approach work. Loving it so far!
    <br/><br/>
    Writestack is pretty intuitive, and Orel is always there to answer any questions.`,
    author: "Parth Shah",
    image: "/testimonials/parth-shah.png",
    title: "Author of Karam's Legacy",
    url: "https://substack.com/@parthshahseo",
  },
  {
    quote: `I had been looking for something to help me more consistent with posting Substack Notes as I recognized the importance for helping grow my brand.
    <br/><br/>
    What I found was not only a tool that could keep me consistent, but also offered tons of other features that allow me to focus on what I came to Substack for; to share ideas.
    <br/><br/>
    Orel has been totally responsive when I have small issues and appreciative of my questions regarding features. He even keeps adding things as we go.
    <br/><br/>
    Great product, great support, <strong>highly recommended!</strong>`,
    author: "Joe Mills",
    image: "/testimonials/joe-mills.jpg",
    title: "Author of Aligned Influence",
    url: "https://substack.com/@infolosophy",
  },
  {
    quote: `I'm loving the experience of reading and writing science fiction and connecting with a growing audience for my work on Substack.
    <br/><br/>
    WriteStack already helped me a lot in achieving that, even though I've only been using the tool for a few weeks.
    <br/><br/>
    It helped me organise, refine and publish my notes,  to find who might be interested in my work and equally to find authors whose work I'm interested in reading too!
    <br/><br/>
    For the metric lovers, here's the before and after of my followship on Substack. I'm new to the platform but as you can see my audience is getting larger very quickly now.`,
    noteImage: "/testimonials/bruno-testimonial.png",
    author: "Bruno Martins",
    image: "/testimonials/bruno.webp",
    title: "Author of Dark Matter",
    url: "https://substack.com/@brunorothgiesser",
  },
  {
    quote: `Writing a newsletter outline used to take me hours. Now I do it in minutes.
  ${appName} makes that possible for me.
<br/><br/>
I can generate new article outlines in minutes,
and the exciting part is the AI assistant that helps me using my exact writing style.
<br/><br/>
And what I like about it is just how easy it is to copy and paste the results into my substack writer tool.`,
    author: "MacDaniel Chimedza",
    image: "/testimonials/macdaniel-chimedza.png",
    title: "Author of The Weekly Mindset",
    url: "https://substack.com/@macdanielchimedza",
  },
];

export const currencyToSymbol = (currency: string) => {
  switch (currency) {
    case "usd":
      return "$";
    case "eur":
      return "€";
    case "gbp":
      return "£";
    case "cad":
      return "CA$";
    case "aud":
      return "A$";
    case "chf":
      return "CHF";
    case "jpy":
      return "¥";
    default:
      return "";
  }
};
