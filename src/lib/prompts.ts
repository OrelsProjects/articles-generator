import { Model } from "@/lib/openRouter";
import { ArticleWithBody } from "@/types/article";
import { Idea } from "@/types/idea";
import { PublicationMetadata } from "@prisma/client";

export type ImprovementType = keyof typeof improvementPromptTemplates;

export type OutlineLLMResponse = {
  outlines: { id: number; outline: string }[];
};

export type IdeaLLM = {
  id?: string;
  title: string;
  subtitle: string;
  description: string;
  inspiration: string;
  image: string;
};
export type IdeasLLMResponse = {
  ideas: IdeaLLM[];
};

export const fixJsonPrompt = (json: string) => [
  {
    role: "system",
    content: `
    You are an expert JSON formatter.
    Your task is to format the following JSON string into a valid JSON object, ensuring:
    1. All property names use double quotes
    2. All string values use double quotes
    3. Special characters are properly escaped
    4. No trailing commas
    5. Valid JSON syntax

    The text might be missing {} or other JSON formatting.
    If that's the case, figure out the correct JSON format and return it.
    
    The response should be in JSON format, without any additional text or formatting.
    {
      "json": "<formatted JSON string>"
    }
    `,
  },
  {
    role: "user",
    content: `
    String to format:
    ${json}
    `,
  },
];

export const generateOutlinePrompt = (
  publication: PublicationMetadata,
  ideaDescriptions: { id: number; description: string }[],
  publicationDescription: string,
  topArticles: ArticleWithBody[],
  shouldSearch: boolean,
) => [
  {
    role: "system",
    content: `
    ${publication.generatedDescription}
    ${publication.writingStyle}

      You are an expert article writer specializing in creating engaging, well-structured content tailored to specific audiences. Your work is guided by the following publication description:
      "${publicationDescription}"

      The user will provide 5 top-performing articles. Analyze these articles to understand the publication's editorial focus, tone, and style. Ensure the outline aligns with the brand's voice and resonates with the target audience.

      Here are multiple article ideas:
      ${ideaDescriptions.map(idea => `- (${idea.id}): ${idea.description}`).join("\n")}

      Your task:
      - Craft a detailed outline for EACH article idea provided, using insights from the top articles and the publication's editorial direction.
      - Use clear, hierarchical headings (H2 to H6) to organize the structure logically.
      - Include concise bullet points or brief notes under each heading to clarify key points, arguments, or ideas that should be covered.
      
      Guidelines:
      - Do NOT include the article title (H1) in the outline.
      - Write in a natural, human-like voice, avoiding any robotic or AI-generated tone.
      - Ensure the outline promotes clarity, coherence, and reader engagement.
      - VERY IMPORTANT: The outline should rely MAINLY on the writing style and the top articles to generate the outline.
      - Use h2 for the title of each section.
      - Don't start all the words in the headings with a capital letter, unless absolutely necessary. First word of the heading can be capitalized.
      ${shouldSearch ? `- Search the web for data and use it to improve the outline of the article.` : ""}
      ** The response should be in Markdown (.md) format. **

      The final output should be structured in the following JSON format, without any additional text or formatting:
      {
        "outlines": [
          {
            "id": <idea id>,
            "outline": "<generated outline in Markdown format>"
          }
        ]
      }
    `,
  },
  {
    role: "user",
    content: `
      Here are the top 5 articles for reference:
      ${topArticles.map((article, index) => `Article ${index + 1}: ${article.bodyText}`).join("\n\n")}

      Analyze these articles carefully and generate comprehensive outlines for each provided idea description, including the corresponding ID for each.
    `,
  },
];

export const generateIdeasPrompt = (
  publication: PublicationMetadata,
  topArticles: ArticleWithBody[],
  options: {
    topic?: string | null;
    inspirations?: ArticleWithBody[];
    ideasUsed?: {
      title: string;
      subtitle: string;
      description: string;
    }[];
    ideasCount: number;
    shouldSearch: boolean;
  } = {
    ideasCount: 3,
    ideasUsed: [],
    shouldSearch: false,
  },
) => [
  {
    role: "system",
    content: `
    ${publication.generatedDescription}
    ${publication.personality}
    ${publication.specialEvents}
    ${publication.privateLife}
    ${publication.topics}
    ${publication.writingStyle}
    
    Your task is to generate ${options.ideasCount} original article ideas for the user based on ${
      options?.topic
        ? `the topic provided. Focus exclusively on this topic. Every idea must revolve strictly around this topic with no deviations.`
        : "your publication description, topics you write about, and your writing style"
    }.

    Additionally, consider the top 5 articles in your genre to ensure relevance and appeal.
    The response must be structured in JSON format with the following details, without any additional text or formatting:

    {
      "ideas": [
        {
          "title": "<Article Title>",
          "subtitle": "<Article Subtitle>",
          "description": "<Brief description of the article>",
          "inspiration": "<Brief note on what inspired this idea, referencing relevant top articles or user topics>",
          "image": "<Image URL for the article>"
        }
      ]
    }

    Guidelines for generating content:
    - Ensure titles are compelling and relevant to your audience. Use the articles' titles and subtitles as templates for the ideas' titles and subtitles.
    - Subtitle has to be connected to the title and complement it.
    - Focus on originality while drawing subtle inspiration from popular content.
    - Avoid generic topics; provide unique angles or fresh perspectives.
    - Write in a human, natural voice that doesn't sound AI-generated.
    - **Make sure the titles and subtitles have the same format and style as the top articles.**  
    - Don't start all the words in the title and subtitle with a capital letter, unless absolutely necessary.
    - If the provided titles have emojis, use them in the generated titles.
    - The image should be a URL of an image that is relevant to the article.
    ${options.inspirations && options.inspirations.length > 0 ? `- Use the following article ideas as inspiration: ${options.inspirations.map(inspiration => `- ${inspiration.title}`).join(", ")}.` : ""}
    ${options.ideasUsed && options.ideasUsed.length > 0 ? `- Do not generate ideas that are similar to the ones provided in the "ideasUsed" array: ${options.ideasUsed.join(", ")}.` : ""}
    ${options.shouldSearch ? `- Search the web for data and use the results as inspiration to generate ideas.` : ""}
        `,
  },
  {
    role: "user",
    content: `
        ${
          options?.topic
            ? `The topic is: ${options.topic}. Ensure all generated ideas are strictly focused on this topic. No exceptions.`
            : ` 
    Below is your publication information:
    - Topics: ${publication.topics}
    - Writing Style: ${publication.writingStyle}
    `
        }

        ${
          options.ideasUsed && options.ideasUsed.length > 0
            ? `Here are the ideas that you should not generate: ${options.ideasUsed.map(idea => `Title: ${idea.title}, Subtitle: ${idea.subtitle}, Description: ${idea.description}`).join("\n")}.`
            : ""
        }

    Here are the articles you need to use as guidelines:

${topArticles
  .map(
    (article, index) =>
      `Article ${index + 1}:
      Title: ${article.title}
      Subtitle: ${article.subtitle}
      Body: ${article.bodyText}`,
  )
  .join("\n---\n")}`,
  },
];

export const generateDescriptionPrompt = (
  description: string,
  topArticles: ArticleWithBody[],
) => [
  {
    role: "system",
    content: `
   Help user generate a summary of a writer's profile based on their description
 and articles. Response should be concise, but cover the overall information and don't leave out
  important details. Response must be in the second-person point of view, include only the following information:
- About them: who they are, what they do, what they like, projects they're working on (if any). Write like you're asking someone to mimic that person
- Topics: topics they write about 
- Writing style: Describe their writing style and tone. It's important to stress the writing characteristics like short and concise, or detailed, use of metaphors, technical depth, etc. Be as detailed as possible
- Personality: Describe their personality, what they're like, what they're known for, what they're famous for.
- Sepcial events: Describe any special events they've been part of, awards they've won, or any other notable achievements.
- Private life: Describe their private life, their family, their friends, their pets, their hobbies, their interests.
- Be direct and certain. Don't be afraid to say that they're the best or that they're the most talented.
The response should always be structured in JSON format, with proper escape string for clarity and consistency. Here is an example of the JSON response expected:
{
  "about": "<generated about them>",
  "topics": "<generated topics>",
  "writingStyle": "<generated writing style>",
  "personality": "<generated personality>",
  "specialEvents": "<generated special events>",
  "privateLife": "<generated private life>"
}
    `,
  },
  {
    role: "user",
    content: `
      Description: ${description}
      Top Articles: ${topArticles.map((article, i) => `Article ${i + 1}: Title: ${article.title} \n Subtitle: ${article.subtitle} \n Body: ${article.bodyText}`).join("\n")}
    `,
  },
];

export const generateImprovementPrompt = (
  type: ImprovementType,
  text: string,
  idea?: Idea | null,
): {
  messages: {
    role: string;
    content: string;
  }[];
  model: Model;
} => {
  const improvementPrompt = improvementPromptTemplates[type];
  const { prompt, task } = improvementPrompt;
  const model = improvementPrompt.model || "anthropic/claude-3.5-sonnet";

  const messages = [
    {
      role: "system",
      content: `${prompt}

        Your task is to ${task}.

        Response must follow these strict rules:
        - **Preserve all existing formatting**, including Markdown elements like headings (#), lists (-, *), bold (**), italics (*), code blocks (\`\`\`), and inline code (\`...\`).
        - **Enhance readability where needed**: You may improve formatting **only if it helps clarity** (e.g., adding line breaks, better structuring paragraphs, or reformatting lists).
        - **Do not remove any structure unless necessary**: Keep the original layout but refine or expand it when beneficial.
        - **Maintain proper paragraph spacing**: Ensure smooth transitions and logical flow.
        - **Return only the improved text**, with no explanations or comments.
        - **The writing must feel completely human**: Avoid robotic patterns or excessive formalism.
        - If you keep the same title text, keep the capitalization like the original text.
        ${type === "elaborate" ? "- Include images in the outline, where relevant." : ""}

       ${
         idea
           ? `Here's the rest of the article for context:
        ${idea?.body.slice(0, 3000)}`
           : ""
       }
      `,
    },
    {
      role: "user",
      content: `
      Text: ${text}
      `,
    },
  ];

  return {
    messages,
    model,
  };
};

const improvementPromptTemplates: {
  [key: string]: {
    task: string;
    prompt: string;
    model?: Model;
  };
} = {
  elaborate: {
    task: "elaborate on the user's text",
    prompt: `You are an expert writer, expand on the user's text to make it more detailed and informative.`,
    model: "google/gemini-2.0-flash-001",
  },
  improve: {
    task: "make it better",
    prompt: `Act like a seasoned editor and improve the user's article.`,
  },
  grammar: {
    task: "improve user's article",
    prompt: `You are a proficient editor, correct any grammatical, punctuation, or syntax errors in the user's article. Preserve the original tone and intent while ensuring the text flows naturally. The final version should read as if written effortlessly by a native speaker, without any signs of AI involvement.`,
  },
  translate: {
    task: "translate user's article",
    prompt: `You are a skilled translator, convert the user's article into fluent English. Maintain the original meaning, tone, and nuance of the message. The translated article should read naturally to native English speakers, without any awkward phrasing or signs of machine translation.`,
  },
  hook: {
    task: "improve user's article with a hook",
    prompt: `You are a creative copywriter, craft an engaging hook for the user's article that captures attention immediately. The hook should be compelling and relevant to the content that follows. Ensure it reads naturally and authentically, avoiding any formulaic or AI-generated patterns.`,
  },
  details: {
    task: "improve user's article with more details",
    prompt: `You are an insightful writer, expand on the user's article by adding relevant details that enrich the content. Provide additional information or context that enhances understanding. Ensure the expanded article flows naturally and retains the user's original voice, without appearing artificially generated.`,
  },
  clarity: {
    task: "improve user's article with more clarity",
    prompt: `You are a clear communicator, revise the user's article to enhance its clarity and ensure the message is easily understood. Simplify complex language or ideas without losing meaning. The final article should read smoothly and naturally, without any indication of AI assistance.`,
  },
  engaging: {
    task: "improve user's article and make it more engaging",
    prompt: `You are an engaging storyteller, rewrite the user's article to make it more captivating and interesting to readers. Use lively language and an appealing tone to draw in the audience. Ensure the article feels authentic and natural, avoiding clichéd expressions or signs of AI composition.`,
  },
  humorous: {
    task: "rephrase user's article in a funny style",
    prompt: `You are a witty humorist, infuse the user's article with humor appropriate to the message. Use clever wordplay or light-hearted jokes to make it entertaining. Ensure the humor feels natural and complements the original intent, without appearing forced or artificially generated.`,
  },
  positive: {
    task: "improve and rephrase user's article in a positive tone",
    prompt: `You are an optimistic writer, revise the user's article to convey a positive tone. Emphasize uplifting language and an encouraging perspective while maintaining the core message. The article should read naturally and sincerely, avoiding exaggerated positivity that might seem inauthentic or AI-produced.`,
  },
  creative: {
    task: "improve user's article and make it positive",
    prompt: `You are an imaginative writer, enhance the user's article with creative language and original ideas. Introduce fresh expressions or metaphors that enrich the content. Ensure the creativity feels genuine and flows naturally, without any sign of artificial enhancement.`,
  },
  sarcastic: {
    task: "improve and rephrase user's article in a sarcastic tone",
    prompt: `You are a sharp-witted commentator, rewrite the user's article with a sarcastic tone. Use irony or satirical remarks to convey the message humorously. Ensure the sarcasm is clear and feels naturally integrated, avoiding overuse or unnatural phrasing that might reveal AI involvement.`,
  },
  inspirational: {
    task: "improve and rephrase user's article in an inspirational tone",
    prompt: `You are an inspiring wordsmith, elevate the user's article to motivate and uplift readers. Use powerful language and positive messages that resonate emotionally. Ensure the inspirational tone feels authentic and natural, without clichés or indications of AI generation.`,
  },
  concise: {
    task: "make user's article more concise",
    prompt: `You are a succinct communicator, refine the user's article to express the message as concisely as possible without losing essential meaning. Eliminate unnecessary words or redundancy. The final article should be clear, to the point, and read naturally, without signs of abrupt truncation or AI editing.`,
  },
};

export const generateFirstMessagePrompt = (
  article: string,
  writer?: string,
) => [
  {
    role: "system",
    content: `
    Write a casual, friendly message to an article's author that feels like a text from a friend. Keep it under 25 words. Show genuine interest by:

    - Mentioning you read their piece
    - One specific aspect you liked
    - A natural question to start conversation about their writing process

    Guidelines:
    - Use third grade English and words
    - The message should be under 25 words
    - The message should show genuine interest in the article, don't sound too excited
    - The message should be casual and friendly, like writing to an old friend
    - Have proper punctuation, grammar, spacing and new lines to make it readable
    - Start the message with ${writer ? `"Hey, ${writer} :)"` : "Hey, :)"}.
    - Make a new line before the question
    - Escape the message to be a valid JSON string


    The response should be in JSON format, with the following details, **without any additional text or formatting**, ONLY THE JSON:
    {
      "message": "<generated message>"
    }
    `,
  },
  {
    role: "user",
    content: `
    Article: ${article}
    ${writer ? `Writer: ${writer}` : ""}
    `,
  },
];
