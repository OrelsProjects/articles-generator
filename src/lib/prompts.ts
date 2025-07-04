import { TitleImprovementType } from "@/components/ui/text-editor/dropdowns/title-menu";
import { Model } from "@/lib/open-router";
import { ArticleWithBody } from "@/types/article";
import { Idea } from "@/types/idea";
import { Note, PublicationMetadata, UserMetadata } from "@prisma/client";
import { Post, Publication } from "../../prisma/generated/articles";

export type ImprovementType = keyof typeof improvementPromptTemplates;

export type OutlineLLMResponse = {
  outlines: { id: number; outline: string; title: string; subtitle: string }[];
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

const avoidWordsPrompt = `
- Don't use the words or any form of them: embrace, emerge
`;

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

      The user will provide ${topArticles.length} top-performing articles. Analyze these articles to understand the publication's editorial focus, tone, and style. Ensure the outline aligns with the brand's voice and resonates with the target audience.

      Here are the article ideas:
      ${ideaDescriptions.map(idea => `- (${idea.id}): ${idea.description}`).join("\n")}

      Your task:
      - Craft a detailed outline for EACH article idea provided, basing the outline the the user's articles structure.
      - Use clear, hierarchical headings (H2 to H6) to organize the structure logically.
      - Include concise bullet points or brief notes under each heading to clarify key points, arguments, or ideas that should be covered.
      
      Guidelines:
      - Do NOT include the article title (H1) in the outline.
      - Write in a natural, human-like voice, avoiding any robotic or AI-generated tone.
      - Ensure the outline promotes clarity, coherence, and reader engagement.
      - VERY IMPORTANT: The outline should rely MAINLY on the writing style and the structure of the user's articles.
      - If the user has a specific opening/closing for the article, use it in the outline.
      - If the idea is a list of items (Ex: Top 10 productivity tips, 7 ways to improve your writing, etc.), make sure the outline has a list of suggestions for those items.
      - The title and subtitle should be improved with a better hook. It should engage the reader, while keeping it concise and relevant to the article's content.
      - The title must not have all the words in capital letters. Only if it adds value to the title.
      - Subtitle should expand on the title and provide more context.
      ${shouldSearch ? `- Search the web for data and use it to improve the outline of the article.` : ""}
      ** The response should be in Markdown (.md) format. **

      The final output should be structured in the following JSON format, without any additional text or formatting:
      {
        "outlines": [
          {
            "id": <idea id>,
            "title": "<generated title>",
            "subtitle": "<generated subtitle>",
            "outline": "<generated outline in Markdown format>"
          }
        ]
      }
    `,
  },
  {
    role: "user",
    content: `
      Here are my articles:
      ${topArticles.map((article, index) => `Article ${index + 1}: ${article.bodyText}`).join("\n\n")}

      Analyze these articles carefully and generate comprehensive outlines for each provided idea description, including the corresponding ID for each.
    `,
  },
];

export const generateVectorSearchOptimizedDescriptionPrompt = (userMetadata: {
  notesDescription: string | null;
}) => [
  {
    role: "system",
    content: `
          You are an expert prompt engineer specialized in semantic search optimization. Your goal is to generate a concise, extremely targeted piece of text optimized specifically for vectorization and embedding into a semantic vector database. This text will be used to perform precise and relevant semantic searches, retrieving items (tweets, posts, notes, or articles) that align closely with the described user's specific preferences, interests, style, and content goals.

          Follow these detailed instructions meticulously:

          Input Understanding:

          Clearly understand the user's description provided, identifying specific keywords, interests, themes, style, and context.

          Pay special attention to the user's explicit preferences, writing style, and the topics that matter most to them.

          Topic Extraction & Talking‑Point Identification:

          Parse the description to surface 3‑6 primary topics

          Detect recurring talking points or thematic clusters

          Rank topics and talking points by relevance, then weave the highest‑value ones into the optimized text.

          Ensure the final text orients around entrepreneurship / creator‑business context, even if the source description is broad.

          Text Optimization:

          Conciseness: Keep the text between 60‑100 words. Every word must directly serve semantic relevance and search efficiency.

          Semantic Density: Include high‑relevance keywords and phrases closely matching the user's description. Avoid generic words.

          Relevance Emphasis: Highlight core themes, key interests, exact topics, specific technologies, methods, and styles explicitly preferred by the user.

          Exclusion Criteria: Explicitly mention topics, styles, or themes to exclude based on the user's description.**:

          Conciseness: Keep the text between 60-100 words. Every word must directly serve semantic relevance and search efficiency.

          Semantic Density: Include high‑relevance keywords and phrases closely matching the user's description. Avoid generic words.

          Bias Minimization: Avoid personal identifiers (e.g., specific names) and exact numeric counts (e.g., "500+", "200+") unless they are contextually essential, to prevent skewing vector relevance.

          Relevance Emphasis: Highlight core themes, key interests, exact topics, specific technologies, methods, and styles explicitly preferred by the user.

          Exclusion Criteria: Explicitly mention topics, styles, or themes to exclude based on the user's description.

          Formatting and Clarity:

          Write clearly, logically, and succinctly.

          Use bullet points if necessary, but keep them minimal.

          Ensure readability and ease of semantic interpretation by embedding algorithms.

          Final Output Structure:

          A single cohesive paragraph optimized for embedding into vector databases.

          Clearly reflect and encapsulate user identity, interests, preferences, and goals.

          *Don't include the words Substack, notes, note in any way in the description.*

          Return Format:

          Return type: JSON

          Return exactly one JSON object with a single key: "optimizedDescription".

          The value must be the generated description string.

          Output nothing else—no additional keys, commentary, or formatting outside the JSON object.


          **Response Format**:
          {
            "optimizedDescription": "<Transformed description text>"
          }

          The value must be the generated description string.

          Output nothing else—no additional keys, commentary, or formatting outside the JSON object.
    `,
  },
  {
    role: "user",
    content: `
    ${userMetadata.notesDescription}
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
    ideasArchived?: {
      title: string;
      subtitle: string;
      description: string;
    }[];
    ideasCount: number;
    shouldSearch: boolean;
    language?: string;
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
    - The image should be a URL of an image that is relevant to the article, must be a stock image with a valid URL from unsplash.com.
    ${options?.topic ? `- If the topic is about a list of items, make sure the title and subtitle are very relevant to the list description.` : ""}
    ${options.inspirations && options.inspirations.length > 0 ? `- Use the following article ideas as inspiration: ${options.inspirations.map(inspiration => `- ${inspiration.title}`).join(", ")}.` : ""}
    ${options.ideasUsed && options.ideasUsed.length > 0 ? `- Do not generate ideas that are similar to the ones provided in the "ideasUsed" array: ${options.ideasUsed.join(", ")}.` : ""}
    ${options.shouldSearch ? `- Search the web for data and use the results as inspiration to generate ideas.` : ""}
    - Side note: If all the titles in the articles have the same format, use the same format for the generated titles.
    ${options.language ? `- The ideas must be in ${options.language} language.` : ""} 
        `,
  },
  {
    role: "user",
    content: `
    ${
      publication.personalDescription
        ? `Here is my description: ${publication.personalDescription}. Ensure all generated ideas are aligned with my description.`
        : ""
    }
        ${
          options?.topic
            ? `The topic is: ${options.topic}. Ensure all generated ideas are strictly focused on this topic. No exceptions.`
            : publication.preferredTopics
              ? `Here are the topics I prefer to write about: ${publication.preferredTopics}. Ensure all generated ideas are related to these topics.`
              : ` 
    Below is my publication information:
    - Topics: ${publication.topics}
    - Writing Style: ${publication.writingStyle}
    `
        }

        ${
          options.ideasUsed && options.ideasUsed.length > 0
            ? `Here are the ideas that the I already has and should not be repeated: ${options.ideasUsed.map(idea => `Title: ${idea.title}, Subtitle: ${idea.subtitle}, Description: ${idea.description}`).join("\n")}.`
            : ""
        }

        ${
          options.ideasArchived && options.ideasArchived.length > 0
            ? `Here are the ideas that the I has archived and should either be improved or not repeated at all: ${options.ideasArchived.map(idea => `Title: ${idea.title}, Subtitle: ${idea.subtitle}, Description: ${idea.description}`).join("\n")}.`
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
You are a no-nonsense literary profiler. Your mission is to create a razor-sharp, second-person profile of the writer based on the supplied description and articles. Address the writer only as “you.”

############################
##   CORE OBJECTIVES      ##
############################
1. **Second-person only** – every sentence points at “you.”
2. **Relevance filter** – use facts, themes, and quirks that appear more than once across the input. Skip one-off trivia.
3. **Detail with bite** – vivid, specific, and concise. One killer line beats three soggy ones.
4. **No duplication** – if a detail sits in one field, don’t parrot it elsewhere.
5. **Voice matching** – mirror the dominant tone you detect (structured, chaotic, poetic, blunt, etc.).
6. **Return format** – **exactly** one JSON object with these eight keys:
   \`about\`, \`aboutGeneral\`, \`topics\`,
   \`writingStyle\`, \`personality\`,
   \`specialEvents\`, \`privateLife\`, \`highlights\`.

############################
##   FIELD GUIDELINES     ##
############################
• **about** – Open with “You are…”. 70–120 words. Who you are, what you do, current projects, core interests.  
• **aboutGeneral** – Third-person rewrite of “about,” 20–30 words, no personal pronouns.  
• **topics** – 5–12 comma-separated nouns or short noun phrases, ranked by frequency. Deduplicate.  
• **writingStyle** – 50–90 words on structure, tone, pacing, language quirks.  
• **personality** – 40–70 words. Strong claims, bold adjectives, no hedging.  
• **specialEvents** – Major awards, launches, media features; comma-separated, chronological if possible.  
• **privateLife** – 30–50 words on hobbies, family tidbits, routines that peek through the writing.  
• **highlights** – 3–6 bullet-style sentences (use “; ” as separator) of top milestones or memorable flops.

############################
##   EXTRA RULES          ##
############################
• When in doubt about a fact, describe the motivation or pattern behind it rather than invent specifics.  
• Avoid jargon unless it’s central to identity.  
• Keep language plain, punchy, and story-driven.  
• Validate JSON before returning. No extra text outside the JSON.  
• Absolutely no “they/them.” Always “you.”  
    
**Response Format**:
Return exactly one JSON object with the keys:
\`about\`, \`aboutGeneral\`, \`topics\`, \`writingStyle\`, \`personality\`, \`specialEvents\`, \`privateLife\`, \`highlights\`.

For example:

{
  "about": "<generated about>",
  "aboutGeneral": "<generated aboutGeneral>",
  "topics": "<generated topics>",
  "writingStyle": "<generated writingStyle>",
  "personality": "<generated personality>",
  "specialEvents": "<generated specialEvents>",
  "privateLife": "<generated privateLife>",
  "highlights": "<generated highlights>"
}

Make sure your final output is valid JSON. Avoid extra text outside the JSON. Always use second-person language (e.g., “You explore...”). Avoid “they/them.”
    `,
  },
  {
    role: "user",
    content: `
Description: ${description}

Top Articles:
${topArticles
  .map(
    (article, i) => `Article ${i + 1}:
Title: ${article.title}
Subtitle: ${article.subtitle}
Body: ${article.bodyText}`,
  )
  .join("\n")}
`,
  },
];

export const generateNotesDescriptionPrompt = (
  topNotes: { body: string }[],
) => [
  {
    role: "system",
    content: `
You are a skilled literary profiler. Your task is to construct a deep, second-person profile of this writer based on personal notes. 
You must always address the writer directly as "you," never using "they/them."

**Goals & Tone**:
1. Write in second-person: speak to the writer as “You...” 
2. Derive key traits from the content of the notes, reflecting the writer’s style and perspective.
3. If the notes indicate a certain flow (structured, chaotic, introspective, direct, etc.), capture and describe it.
4. Convey a sense of authenticity—be certain and confident, highlighting the writer’s talents or achievements without hesitation.

**What to Include** (in your JSON response):
1. **noteWritingStyle**: A thorough breakdown of how you (the writer) typically organize thoughts, the tone of your notes, and any distinct writing habits (e.g., concise bullet points, stream-of-consciousness, reflective questioning).
2. **noteTopics**: A comma-separated list of the main themes or subjects found across these notes.
3. **notesDescription**: A description of the notes, including the main themes or subjects found across these notes.

**Response Format**:
Return exactly one JSON object with the keys:
\`noteWritingStyle\`, \`noteTopics\`, and \`notesDescription\`.

For example:

{
  "noteWritingStyle": "<generated noteWritingStyle>",
  "noteTopics": "<generated noteTopics>",
  "notesDescription": "<generated notesDescription>"
}

Ensure the final output is valid JSON, with no extra text outside the JSON object. Always use second-person language, and avoid “they/them.”
    `,
  },
  {
    role: "user",
    content: `
Top Notes:
${topNotes.map((note, i) => `Note ${i + 1}: ${note.body}`).join("\n")}
`,
  },
];

const improvementPromptSystemPost = (
  text: string,
  type: ImprovementType,
  options?: {
    maxLength?: number;
  },
) => {
  const improvementPrompt = improvementPromptTemplates[type];
  const model = improvementPrompt.model || "anthropic/claude-3.7-sonnet";
  const { prompt, task } = improvementPrompt;
  const maxLength =
    options?.maxLength || type === "elaborate" ? text.length * 2 : text.length;
  const systemMessage = `
        ${type === "custom" ? "" : prompt}

        Your task is to ${task}.

        Response must follow these strict rules:
        - Preserve all existing formatting, including Markdown elements like headings (#), lists (-, *), bold (**), italics (*), code blocks (\`\`\`), and inline code (\`...\`). This is extremely important. 
        ${
          type === "elaborate"
            ? `
          - If there is a bulleted list, elaborate on each item in the list add more details, more information, more context, etc. Bold the title of the item you elaborate on and write the new text in a new line.
          - No matter what, never cut short the text. Elaborate on everything, and if you can't elaborate on something, just write the original text.
          - Use the article context as a guideline to the writing style of the elaborated response.
          `
            : ""
        }
        ${type === "elaborate" ? `- If there is a title, elaborate on it add more details, more information, more context, etc.` : ""}
        ${type === "fact-check" ? `- If the text is mostly correct and there are only places to elaborate, return only the original text, without any explanations or changes.` : ""}
        - Ensure the response is no longer than ${maxLength} characters. Strictly adhere to this constraint.
        - Enhance readability where needed: You may improve formatting only if it helps clarity (e.g., adding line breaks, better structuring paragraphs, or reformatting lists).
        - Do not remove any structure unless necessary: Keep the original layout but refine or expand it when beneficial.
        - Maintain proper paragraph spacing: Ensure smooth transitions and logical flow.
        - Return only the improved text, with no explanations or comments.
        - The writing must feel completely human: Avoid robotic patterns or excessive formalism.
        - If you keep the same title text, keep the capitalization like the original text.
  `;
  return {
    systemMessage,
    model,
  };
};

const improvementPromptSystemNote = (
  type: ImprovementType,
  options: {
    maxLength: number;
  },
) => {
  const improvementPrompt = improvementPromptTemplates[type];
  const model = improvementPrompt.model || "anthropic/claude-3.7-sonnet";
  const { prompt, task } = improvementPrompt;

  // For notes, we want to be more strict about length constraints
  // Most social media platforms have character limits
  const maxLength = options?.maxLength || 280; // Twitter-like character limit

  const systemMessage = `
  ${prompt}

        Your task is to ${task} for a social media note (similar to a tweet).

        Response must follow these strict rules:
        - Preserve the original voice, tone, and personality of the note
        - Maintain any hashtags, mentions, or emojis that were in the original text
        - Keep the note concise and impactful - optimize for engagement
        - Ensure the response is no longer than ${maxLength} characters (this is critical)
        - Focus on making the note more shareable, likeable, and reply-worthy
        - No hashtags or mentions in the response.
        - Add emojis *only* if they appear in the user's original text.
        - Use formatting to make the note as clear as possible.
        - The final result has to pass the Flesch-Kincaid readability test with a score of 70 or higher.
        - If you create a list of items, make sure to add a line break between each item and add -> at the beginning of each item.
        - Mark a new line with double '\\n' (blackslash n). No hard line breaks.

        ${
          type === "elaborate"
            ? `
            - When elaborating, prioritize adding value rather than length
            - Focus on strengthening the main point rather than adding tangential information
            ${maxLength ? `- If elaborating would make the note exceed ${maxLength} characters, focus on improving clarity and impact instead` : ""}
            `
            : ""
        }
        ${
          type === "engaging"
            ? `
            - Add a hook or question that encourages reader interaction
            - Consider adding a call to action if appropriate
            - Make the note more conversational and relatable
            `
            : ""
        }
        ${
          type === "humorous"
            ? `
            - Add wit or clever wordplay that fits the original tone
            - Don't force humor if it doesn't fit naturally with the content
            - Ensure the humor is appropriate for a broad audience
            `
            : ""
        }
        ${
          type === "fact-check"
            ? `
            - If the note contains factual errors, correct them concisely
            - If the note is factually accurate, focus on making it more precise or clear
            - Don't add unnecessary qualifiers that weaken the message
            `
            : ""
        }
        - The writing must feel completely human and authentic
        - The note should read as if written by the original author, just improved
        - Return only the improved note text, with no explanations or comments
        - I can't stress this enough - *Return only the improved note text, with no explanations or comments like 'Here is your improved ....'.* This is mission critical.
  `;

  return {
    systemMessage,
    model,
  };
};

export const generateImprovementPromptPost = (
  text: string,
  type: ImprovementType,
  idea?: Idea | null,
  options: { extras?: string; customText?: string; language?: string } = {},
): {
  messages: {
    role: string;
    content: string;
  }[];
  model: Model;
} => {
  const { extras, customText, language } = options;
  const { systemMessage, model } = improvementPromptSystemPost(text, type);
  const messages = [
    {
      role: "system",
      content: `${systemMessage}
        ${idea ? `- Make sure the response is relevant and related to the rest of the article provided.` : ""}
        ${extras ? extras : ""}
        ${language ? `- The response must be in ${language} language.` : ""}
      `,
    },
    {
      role: "user",
      content: `
      Text: ${text}
      \n\n
      ${customText ? `My instructions: ${customText}` : ""}
      \n\n
      ${
        idea
          ? `Here's my article for context:
      ${idea?.body.slice(0, 3000)}`
          : ""
      }
      `,
    },
  ];

  return {
    messages,
    model,
  };
};

export const generateImprovementPromptNote = (
  text: string,
  publication: PublicationMetadata,
  type: ImprovementType,
  options: {
    note?: Note | null;
    userNotes?: string[];
    maxLength?: number;
    language?: string;
  } = {},
): {
  messages: {
    role: string;
    content: string;
  }[];
  model: Model;
} => {
  const { note, userNotes, maxLength, language } = options;
  const shouldShowNotePrompt = note && note.body !== text;
  let validMaxLength = maxLength || 280;
  if (type === "elaborate") {
    validMaxLength =
      validMaxLength >= text.length ? validMaxLength * 2 : validMaxLength;
  }
  const { systemMessage, model } = improvementPromptSystemNote(type, {
    maxLength: validMaxLength,
  });
  const messages = [
    {
      role: "system",
      content: `
      ${publication.generatedDescription || ""}
      ${publication.writingStyle || ""}
      ${systemMessage}
      ${language ? `- The response must be in ${language} language.` : ""}
      `,
    },
    {
      role: "user",
      content: `
      Here's the note I want to improve: ${text}
      \n
      ${shouldShowNotePrompt ? `Here's the entire note for context: ${note.body}` : ""}
      ${
        userNotes && userNotes.length > 0
          ? `Here are some notes I wrote as examples: ${userNotes.join("\n")}`
          : ""
      }
      `,
    },
  ];

  return {
    messages,
    model,
  };
};
export const generateTitleSubtitleImprovementPrompt = (
  menuType: "title" | "subtitle",
  improveType: TitleImprovementType,
  relatedTitles: { title: string; subtitle: string }[],
  idea: Idea,
  value: string,
  userTopArticlesTitles: { title: string; subtitle: string }[],
): { messages: { role: string; content: string }[]; model: Model } => {
  const model = "anthropic/claude-sonnet-4";
  const isTitle = menuType === "title";
  const currentReference = isTitle
    ? idea.title
      ? `Current Title: ${value}`
      : ""
    : idea.subtitle
      ? `Current Subtitle: ${value}`
      : "";

  // Get the corresponding improvement prompt template based on the menu type and improveType
  const improvementPromptTemplate = isTitle
    ? titleImprovementPromptTemplates[improveType]
    : subtitleImprovementPromptTemplates[improveType];

  const systemMessage = `
  You are an expert at crafting engaging ${isTitle ? "titles" : "subtitles"} for articles. ${
    improvementPromptTemplate.prompt
  }

Below is a list of related titles and subtitles to draw inspiration from, but not to copy from:
${relatedTitles
  .map(
    (item, index) =>
      `(${index + 1}) Title: "${item.title}", Subtitle: "${item.subtitle}"`,
  )
  .join("\n")}

Additionally, note that the user's other ${isTitle ? "titles" : "subtitles"} **must be treated as the strict style and format you have to replicate**. Observe carefully how they are structured, including:
- Punctuation (periods, commas, question marks, colons, parentheses, exclamation points),
- Capitalization,
- Emoji usage (if any),
- Word choice (e.g. first-person statements like "I did something...", direct instructions like "Read this before...", or numeric references like "11 mistakes..."),
- And any other noticeable stylistic elements.

Here are the user's reference ${isTitle ? "titles" : "subtitles"}:
${userTopArticlesTitles
  .map(
    (item, index) =>
      `(${index + 1}) Title: "${item.title}", Subtitle: "${item.subtitle}"`,
  )
  .join("\n")}

**You must produce a final ${menuType} that strictly follows the same style and format** as the user's reference examples. If a current ${menuType} is provided, use it as a reference, but feel free to improve or rework it as needed.

Your task is to ${improvementPromptTemplate.task} for the article provided. The new ${menuType} must:
1. Be highly relevant to the article's content and context.
2. Exactly match the style and formatting of the user's other ${menuType === "title" ? "titles" : "subtitles"}.
3. Remain compelling, concise, and reflective of the article's main theme.
4. Use the same approach to punctuation, capitalization, potential emojis, or numeric references that you see in the user's reference ${menuType === "title" ? "titles" : "subtitles"}.
5. If numbers or emojis are not present in the user's reference ${menuType === "title" ? "titles" : "subtitles"}, do not add them unless they add a lot of value to the ${menuType}.
6. Do not add extra text or deviate from the user's established style.

Return only the result in the following JSON format, without additional commentary:
${
  isTitle
    ? `{"title": "<generated title>"}`
    : `{"subtitle": "<generated subtitle>"}`
}
`.trim();

  const userMessage = `
Article content:
${idea.body}

${currentReference}
`.trim();

  const messages = [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];

  return { messages, model };
};

export const generateImproveNoteTextPrompt = (
  text: { index: string; text: string }[],
) => {
  const humanizePrompt = improvementPromptTemplates.human;
  const messages = [
    {
      role: "system",
      content: `${humanizePrompt.prompt}
      - Format the text so it's more engaging and readable.
      - Use markdown formatting.
      - The response must not have a title. It's a note for Substack, similar to a tweet.
      - Only if the text includes emojis, use them.
      - Use the text given as an inspiration and reference. Don't copy it, but stick to the main idea and style.
      - Don't make the response longer than the original text.

      The response must be an array of texts in the following JSON format, without additional text:
      [
        {
          "index": "<index>",
          "text": "<generated text>"
        },
      ]`,
    },
    {
      role: "user",
      content: `
      ${text.map(item => `(${item.index}) ${item.text}`).join("\n")}
      `,
    },
  ];

  return {
    messages,
    model: humanizePrompt.model || "anthropic/claude-sonnet-4",
  };
};

export const getNotesPromptNoteMeta = (
  userNotes: Note[],
  maxLength: number,
) => {
  const userPastNotes = userNotes.map(n => n.body);
  const avgLen = userPastNotes.length
    ? Math.round(
        userPastNotes.reduce((s, n) => s + n.length, 0) / userPastNotes.length,
      )
    : 160;

  // ±20 % band but never under 30 chars.
  const lenFloor = Math.max(20, Math.round(avgLen * 0.2));
  const lenCeil = Math.min(maxLength, Math.round(avgLen * 1.4));
  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Component})/gu;

  const emojiHits = userPastNotes.reduce(
    (c, n) => c + (emojiRegex.test(n) ? 1 : 0),
    0,
  );
  const emojiRatio = emojiHits / Math.max(1, userPastNotes.length);

  return {
    lenFloor,
    lenCeil,
    emojiRatio,
  };
};
// generateNotesPrompt_v2 – spaced‑note upgrade
// -----------------------------------------------------------------------------
// Ensures the model produces visually scannable notes:
//  • Restores 0.8 lower‑bound on length band (we accidentally dropped to 0.4).
//  • Adds explicit layout rules: hook line, blank line, body lines each separated
//    by *double* "\n\n", with no line exceeding 90 chars. Blocks of text are
//    forbidden.
// -----------------------------------------------------------------------------

export const generateNotesPrompt_v2 = ({
  userMetadata,
  publication,
  inspirationNotes,
  userPastNotes,
  userNotes,
  options = {
    noteCount: 3,
    maxLength: 280,
    noteTemplates: [],
    topic: "",
    preSelectedArticles: [],
    includeArticleLinks: false,
  },
}: {
  userMetadata: UserMetadata;
  publication: PublicationMetadata;
  inspirationNotes: string[];
  userPastNotes: string[];
  userNotes: Note[];
  options: {
    noteCount?: number;
    maxLength?: number;
    noteTemplates?: { description: string }[];
    topic?: string;
    preSelectedArticles?: Post[];
    language?: string;
    includeArticleLinks?: boolean;
  };
}) => {
  // ───────────────────────── Defaults ──────────────────────────
  const {
    noteCount = 3,
    maxLength = 280,
    noteTemplates = [],
    topic = "",
    preSelectedArticles = [],
    language,
    includeArticleLinks,
  } = options;

  // ────────────────────────── Stats ────────────────────────────
  const allTopics = userNotes.flatMap(n => n.topics);
  const topicsCount = allTopics.reduce<Record<string, number>>((acc, t) => {
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});

  const avgLen = userPastNotes.length
    ? Math.round(
        userPastNotes.reduce((s, n) => s + n.length, 0) / userPastNotes.length,
      )
    : 160;

  // ±20 % band but never under 30 chars.
  const { lenFloor, lenCeil, emojiRatio } = getNotesPromptNoteMeta(
    userNotes,
    maxLength,
  );

  const rareTopics = Object.entries(topicsCount)
    .sort(([, a], [, b]) => a - b)
    .slice(0, 6)
    .map(([t]) => t);

  // Chance of 0.3 to add new topic as a note
  const shouldAddNewTopic = Math.random() < 0.25;

  // ────────────────────── Style Snapshot ───────────────────────
  const styleSnapshot = `
User style snapshot:
- Avg length ${lenFloor}-${lenCeil} chars
- Emoji ratio ${emojiRatio.toFixed(2)}
- Preferred structures: ${
    noteTemplates.length
      ? noteTemplates.map(t => t.description).join(", ")
      : "(none provided)"
  }
`.trim();

  // ───────────────────── Topic / Article Mode ──────────────────
  const lockToArticles = preSelectedArticles.length > 0;
  const lockToTopic = !lockToArticles && !!topic;

  // ─────────────────────── System Message ──────────────────────

  const systemMessage = `
${publication.generatedDescription || ""}
${userMetadata.noteWritingStyle || publication.writingStyle || ""}
${publication.highlights || ""}

You are an elite Substack note ghostwriter.

${styleSnapshot}

Rules:
1. Return exactly ${noteCount} notes.
2. Each note must be ${lenFloor}-${lenCeil} characters.
3. NO hashtags, colons in hooks, or em dashes.
4. If emojiRatio ≤ 0.20, do not use emojis. Otherwise, match user ratio.
5. Use "\\n\\n" for **every** line break. Never output a single newline.
6. Twist every borrowed idea ≥ 40 % so it’s fresh.
7. Output a JSON array only, following the schema below.
8. Never EVER copy and paste the same note from the user's previously written notes or inspiration notes.
${language ? `9. The notes must be in ${language} language.` : ""}
${
  lockToArticles
    ? `
You must generate exactly ${noteCount} notes, all based strictly on the provided articles.
If there are fewer than ${noteCount} unique articles, continue generating by randomly selecting from the article list again (duplicates allowed).`
    : lockToTopic
      ? `
You must generate ${noteCount} notes, all focused entirely on the topic: **${topic}**.`
      : ""
}

${includeArticleLinks ? `8. Add links to the articles in the end of the note, with a new line before it. (Crucial)` : ""}

⚠️ IMPORTANT – HARD LIMIT  
Any note > ${lenCeil} chars (spaces *included*) is invalid.  
Regenerate it until it fits.

Favor these under‑used topics for freshness: ${rareTopics.join(", ")}
${shouldAddNewTopic ? `Write a note with a completely new topic. It has to be different from ${Object.keys(topicsCount).join(", ")}. Preferably related, okay if not.` : ""}

Required JSON format:
[
  {
    "body": "<Generated note>",
    "summary": "<Concise summary>",
    "topics": ["<Topic 1>", "<Topic 2>", "<Topic 3>"],
    "inspiration": "<Source explanation>"
  }
]
${noteTemplates.length > 0 ? `\nTemplates:\n${noteTemplates.map(t => `• ${t.description}`).join("\n")}` : ""}
`.trim();

  // ──────────────────────── User Message ───────────────────────
  const userMessage = `
$${lockToArticles ? `Articles:\n${preSelectedArticles.map(a => `• ${a.bodyText}${includeArticleLinks ? `\n(Link: ${a.canonicalUrl})` : ""}`).join("\n")}` : ""}

${publication.personalDescription ? `Here's my preffered way of writing. Give it priority when you write notes: ${publication.personalDescription}` : ""}

Preferred topics: ${userMetadata.noteTopics || publication.preferredTopics}

Previously written notes:\n${userPastNotes.map((n, i) => `(${i + 1}) ${n}`).join("\n")}

Inspiration notes:\n${inspirationNotes.map((n, i) => `(${i + 1}) ${n}`).join("\n")}

Topic counts: ${JSON.stringify(topicsCount)}
`.trim();

  // ─────────────────────────── Return ──────────────────────────
  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
};

export const generateNotesPrompt_v1 = ({
  userMetadata,
  publication,
  inspirationNotes,
  userPastNotes,
  userNotes,
  options = {
    noteCount: 3,
    maxLength: 280,
    noteTemplates: [],
    topic: "",
    preSelectedArticles: [],
  },
}: {
  userMetadata: UserMetadata;
  publication: PublicationMetadata;
  inspirationNotes: string[];
  userPastNotes: string[];
  userNotes: Note[];
  options: {
    noteCount?: number;
    maxLength?: number;
    noteTemplates?: { description: string }[];
    topic?: string;
    preSelectedArticles?: Post[];
    language?: string;
  };
}) => {
  const allTopics = [...userNotes.map(note => note.topics).flat()];
  const {
    noteCount,
    maxLength,
    noteTemplates,
    topic,
    preSelectedArticles,
    language,
  } = options;
  // Topics count, json of topic to count
  const topicsCount = allTopics.reduce((acc: Record<string, number>, topic) => {
    acc[topic] = (acc[topic] || 0) + 1;
    return acc;
  }, {});

  const hasPreselectedArticles = preSelectedArticles?.length || 0 > 0;
  const shouldUseTopic = hasPreselectedArticles ? false : true;

  const messages = [
    {
      role: "system",
      content: `
      ${publication.generatedDescription}
      ${userMetadata.noteWritingStyle || publication.writingStyle}
      ${publication.highlights}

    Act as a brilliant social media influencer, very efficient at writing engaging Substack notes.
    Help user write a note with your description, writing style and highlights.
    Think about unique ideas and use the user's provided notes as inspiration only. Be original.
    Notes are like tweets. They need to have one core idea, very impactful and engaging with an amazing hook.
      ${
        topic && shouldUseTopic
          ? `
        The topic of the notes MUST BE ${topic}. Do not deviate from it.
        `
          : (options.preSelectedArticles?.length || 0) > 0
            ? `
          The notes must be relevant to the articles provided. 
          Do not repeat the same topics for each note and make sure they are different.
          Rely on each article as a separate source of inspiration.
          Write one note per article.
          If less than ${noteCount} notes are provided, it's okay to repeat a note for the same article.
          `
            : ""
      }
    Each note to have as little cliches as possible and have insightful information that is not obvious.
    Make the note very non-obvious, so it's almost a clickbait.
    **Don't come up with numbers and facts about the user. Stick to the facts they provide. Rely on the user's description and notes that they posted.**
    The inspiration for new notes have to be from the user's notes and description, not from random things on the internet.
    Avoid repeating the same notes as the user's previously written notes or inspiration notes,
    or writing something that is the opposite of what the user wrote.
    Make sure to not repeat the same topics as the user's previously written notes. Be very unique and creative.
    The notes must be different from the user's previously written notes.
    Each note should have a great hook, that will entice the user to read it from the get-go.
    ${
      noteTemplates && noteTemplates.length > 0
        ? `
    Use the notes that are most relevant to your description and writing style.
    Templates: ${noteTemplates.map(template => `(${template.description})`).join("\\n")}`
        : ""
    }

    Response must follow the following rules:
  - Avoid using hashtags
  - Format the notes properly for best readability. Use new lines, avoid blocks of text.
  - Write with human-writing style, natural language, and avoid sounding like AI generated note
  - Reponse body must have less than ${maxLength} characters, unless the writing style demands more.
  - *Important for Response body:* Follow the user writing style and notes examples. If they write in a very short/long style, follow it.
  - If user uses profanity, use profanity.
  - Body has to be in markdown format.
  - At least one note has to be clean from emojis.
  - Include emojis ONLY if the user's past written notes include them.
  - Make sure it passes the flesch-kincaid test with a score of 70 or higher.
  - ${avoidWordsPrompt}
  - Mark a new line with double '\\n' (blackslash n). No hard line breaks.
  - Do not use dashes or em dash.
  - **Never EVER copy and paste the same note from the user's previously written notes or inspiration notes.**
  
  ${language ? `- The notes must be in ${language} language.` : ""}

  The response **must** be an array of notes in the following JSON format, without additional text:
  [
    {
      "body": "<Generated Note 1>",
      "summary": "<Generated Summary>",
      "topics": ["<Generated Topic 1>", "<Generated Topic 2>", "<Generated Topic 3>"],
      "inspiration": "<Generated Inspiration>",
      "type": "<Generated type>"
    },
  ]

  - 'type': The type of the note. Listicle, Opinion, Analysis, How-To, etc.
  - 'summary': A concise summary of the note.
  - 'inspiration': Which notes inspired you to write this note and why.
  - 'topics': The topics of the note. Up to 3 topics.
    `,
    },
    {
      role: "user",
      content: `
          ${
            !shouldUseTopic
              ? `I want you to write notes that are revolving around these articles, and ONLY these articles. Do not write about other topics.:
            ${options.preSelectedArticles?.map(article => `(${article.bodyText}`).join("\\n")}
            ${topic ? `Here's extra details for the notes: ${topic}` : ""}
            `
              : ""
          }
          ${shouldUseTopic ? `Here are topics I write about and I want you to write about them: ${userMetadata.noteTopics}` : ""}
          ${publication.personalDescription ? `Here's a description of my writing style. I want you to use it and give it priority when you write notes: ${publication.personalDescription}` : ""}
          ${publication.preferredTopics.length > 0 ? `Here are my preferred topics. Use them to generate notes about me: ${publication.preferredTopics.join(", ")}` : ""}

          ${userNotes.length > 0 ? `Here are my previously written notes:` : ""}
          ${userPastNotes.map((note, index) => `(${index + 1}) ${note}`).join("\\n")}
          
          ${inspirationNotes.length > 0 ? `Here are some inspiration notes I liked.` : ""}
          ${inspirationNotes.map((note, index) => `(${index + 1}) ${note}`).join("\\n")}
          
          ${userNotes.length > 0 ? `Here are types of my posts. Please, do not repeat them or create very unique ones:` : ""}  
          ${userNotes.map((note, index) => `(${index + 1}) ${note.type}`).join("\\n")}

          ${userNotes.length > 0 ? `Past notes that I posted:` : ""}
          ${userNotes.map((note, index) => `(${index + 1}) ${note.body}`).join("\\n")}

          ${allTopics.length > 0 ? `Here are all the topics I've written about and their count:` : ""}
          ${JSON.stringify(topicsCount)}
      
          Generate ${noteCount} new notes in my writing style while drawing inspiration from these.`,
    },
  ];

  return messages;
};

export const generateNotesWritingStylePrompt_v2 = ({
  userMetadata,
  publication,
  notesToImprove,
  language,
}: {
  userMetadata: UserMetadata;
  publication: PublicationMetadata;
  notesToImprove: { id: number; body: string }[];
  language?: string;
}) => {
  // ──────────────── Quick stats from existing notes ────────────────
  const bodies = notesToImprove.map(n => n.body);
  const avgLen =
    bodies.reduce((s, b) => s + b.length, 0) / bodies.length || 120;
  const lenFloor = Math.max(30, Math.round(avgLen * 0.8));
  const lenCeil = Math.round(avgLen * 1.2);

  // ───────────────────────── Messages ─────────────────────────────
  const systemMessage = `
${userMetadata.noteWritingStyle || publication.writingStyle || ""}

You are an elite Substack note writer and an efficient ghostwriter and content creator.

⚙️  **Rewrite Rules (top priority)**
1. Preserve the *core idea* and factual meaning. Do **not** add or remove claims.
2. Sharpen the hook and improve readability using the writer's voice.
3. Each improved note must be ${lenFloor}-${lenCeil} characters (spaces included).
4. Avoid clichés, hashtags, semicolons, em‑dashes. Never use the word "embrace".
5. If emoji ratio ≤ 0.20, remove emojis. Else keep ratio roughly the same.
6. Use Markdown. Insert logical breaks with two consecutive newlines ("\\n\\n").
7. Flesch‑Kincaid score ≥ 70 (aim 80+). Short sentences, simple words.
8. Return **only** a JSON array in the exact schema below. No commentary.
9. Any note longer than ${lenCeil} chars is invalid – regenerate it.
10. ${language ? `- The notes must be in ${language} language.` : ""} 

  The response **must** be an array of notes in the following JSON format, without additional text:
  [
    {
      "id": "<note id>",
      "body": "<improved note>"
    },
  ]
`.trim();

  const userMessage = `
${publication.personalDescription ? `Writer style details: ${publication.personalDescription}` : ""}
${publication.preferredTopics.length ? `Preferred topics: ${publication.preferredTopics.join(", ")}` : ""}

Improve these notes (use same IDs):
${notesToImprove.map(n => `(${n.id}) ${n.body}`).join("\n")}
`.trim();

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
};

export const generateNotesWritingStylePrompt_v1 = ({
  userMetadata,
  publication,
  notesToImprove,
}: {
  userMetadata: UserMetadata;
  publication: PublicationMetadata;
  notesToImprove: { id: number; body: string }[];
}) => {
  const messages = [
    {
      role: "system",
      content: `
      ${userMetadata.noteWritingStyle || publication.writingStyle}

    Act as a brilliant social media influencer, very efficient at writing engaging Substack notes.
    Help user improve his notes with your description and writing style.
    Notes are like tweets. They need to have one core idea, very impactful and engaging with an amazing hook.

    Your goal is the improve the writing style, the formatting and structure of the notes.
    The notes should be engaging, easily readable and have a great hook.

    Each note to have as little cliches as possible and have insightful information that is not obvious.
    Make the note very non-obvious, so it's almost a clickbait.
    ** You must not change the core idea of the note. Only improve it based on your writing style. **
    Each note should have a great hook, that will entice the user to read it from the get-go.

  - Must use new lines when needed, avoid using hashtags
  - Write with human-writing style, natural language, and avoid sounding like AI generated note
  - Body has to be in markdown format.
  - Include emojis ONLY if the user's body includes them.
  - Make sure it passes the flesch-kincaid test with a score of 70 or higher, prefer 80 or higher.
  - Don't use the words: embrace.
  - Don't use these signs: ;, --
  
  The response **must** be an array of notes in the following JSON format, without additional text:
  [
    {
      "id": "<note id>",
      "body": "<improved note>"
    },
  ]
    `,
    },
    {
      role: "user",
      content: `
          ${publication.personalDescription ? `Here's a description of my writing style. I want you to use it and give it priority when you write notes: ${publication.personalDescription}` : ""}
          ${publication.preferredTopics.length > 0 ? `Here are my preferred topics. Use them to generate notes about me: ${publication.preferredTopics.join(", ")}` : ""}

          Here are the notes I want you to improve:
          ${notesToImprove.map((note, index) => `(${index + 1}) ${note.body}`).join("\\n")}`,
    },
  ];

  return messages;
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

const improvementPromptTemplates: {
  [key: string]: {
    task: string;
    prompt: string;
    guidelines?: string;
    model?: Model;
  };
} = {
  custom: {
    task: "follow the user's instructions",
    prompt: `{{prompt}}`,
  },
  elaborate: {
    task: "elaborate on the user's text",
    prompt: `You are an expert writer, expand on the user's text to make it more detailed and informative while not repeating the same message.
    Add more details, bullet points and other information to make the text more informative.
    `,
    // model: "google/gemini-2.0-flash-001",
  },
  human: {
    task: "make it human",
    prompt: `Act like a seasoned editor and improve the user's article.
    Make it sound human and natural, without any signs of AI involvement.
    Keep the same tone and writing style.
    The generated text has to pass the flesch-kincaid test with a score of 70 or higher.
    `,
    model: "anthropic/claude-sonnet-4",
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
    prompt: `# ROLE
You are “Hook Builder,” an elite copy chief who turns OK lines into knockout openers.

# OBJECTIVE
Given a raw Substack Note, do ONE of two things:
1. If a hook already exists in the first 1–2 lines, sharpen it *without changing any other lines*.
2. If no clear hook exists, create one that fits the Note’s topic and audience, *without changing any other lines*.

# HOOK RULES
• ≤ 15 words  
• Must slam reader curiosity, emotion, or tension (hit at least one)  
• Conversational voice—no corporate fluff, no jargon

# HOW TO SCORE STOP-POWER (1–10)
Rate the existing first 1–2 lines with this checklist. Each yes = +2 points (max 10).

1. Shock or surprise?  
2. Clear tension or open loop?  
3. Specific, vivid detail or number?  
4. Is the hook cliché? (Less cliché is better)
5. Directly calls out or implicates the reader?  
6. Fresh angle or phrasing (not tired clickbait)?

Map total to final score:

0–1 → 1  
2 → 2  
3 → 3  
4 → 4  
5–6 → 5  
7–8 → 6  
9–10 → 7–10 (10 only if every box is a hell-yes)

If score < 7, replace the hook.

# PROCESS
1. Extract the first 1–2 lines as the “existing hook.”  
2. Apply the scoring rubric.  
3. If < 7, craft a new hook obeying Hook Rules.  
4. If ≥ 7, tighten it (shorten, punch up wording, add specificity) but keep core idea.  
5. Keep the rest of the Note intact unless a tiny edit is needed for flow.
`,
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
  "fact-check": {
    task: "fact-check the user's text",
    prompt: `Check the user's text for accuracy and correctness using the web. If you find any incorrect information, correct it. If you don't find any incorrect information, fix the inaccuracies in the text.`,
  },
  "spell-check": {
    task: "spell-check the user's text",
    prompt: `Check the user's text for spelling and grammar errors. If you find any errors, correct them. If you don't find any errors, fix the errors in the text.`,
  },
  "fit-user-style": {
    task: "Adapt the provided text to match the user's writing style precisely.",
    prompt: `
      You are an expert stylistic editor skilled at accurately identifying and mimicking specific writing styles and tones.

      Your goal is to rewrite the user's provided text to perfectly match their unique writing style, tone, and descriptive preferences.

      Instructions:
      1. Carefully analyze the user's examples or previous writings (if provided) to fully grasp their voice, tone, and style nuances.
      2. Rewrite the text to align closely with the user's authentic style, incorporating their common vocabulary, sentence structure, emotional tone, and descriptive approach.
      3. Ensure the rewritten text is completely original and unique while maintaining the exact meaning and intent of the original text.
      4. Avoid any generic, overly formal, or unnatural phrasing that does not reflect the user's typical expression.

      Clearly output the rewritten text, ensuring it reads naturally, authentically, and seamlessly matches the user's established style.
    `,
  },

  "human-like": {
    task: "Rewrite the text to sound completely natural and human-like.",
    prompt: `
      You're a skilled human copywriter with a conversational, relatable, and authentic writing voice.

      Rewrite the user's provided text to ensure it sounds completely natural and genuinely human-written, removing any trace of AI-generated phrasing.

      Guidelines:
      1. Use everyday conversational language and relatable expressions appropriate to the intended context.
      2. Add natural variations, minor imperfections, and casual nuances common in human writing.
      3. Ensure the text flows smoothly, is engaging, and avoids any overly formal, robotic, or unnatural expressions.
      4. Preserve the original meaning and intention without adding new information or ideas.

      Output only the revised, human-like text clearly and naturally, without commentary.
    `,
  },

  "new-version": {
    task: "Create an entirely new and unique version of the provided text.",
    prompt: `
      You're an expert creative writer capable of effectively rephrasing content into completely original and unique new versions.

      Based on the user's original text, craft a distinct, fresh version that delivers the exact same core message but differs significantly in wording, structure, and style.

      Requirements:
      1. Maintain the original text's core meaning and intended message.
      2. Completely rephrase sentences and rearrange structures to create originality while preserving readability and clarity.
      3. Use different vocabulary, metaphors, or phrasing to ensure the new text feels fresh, distinct, and authentic.
      4. Ensure the rewritten version does not closely resemble the original phrasing or sentence structure.
      5. It should be plagiarism free. Change examples, use different words, but keep the same meaning.
      Output only the new, fully rewritten text version clearly, without any additional explanations or commentary.
    `,
  },
  "better-hook": {
    task: "improve user's article with a hook",
    prompt: `# ROLE
      You are “Hook Builder,” an elite copy chief who turns OK lines into knockout openers.

      # OBJECTIVE
      Given a raw Substack Note, do ONE of two things:
      1. If a hook already exists in the first 1–2 lines, sharpen it.
      2. If no clear hook exists, create one that fits the Note’s topic and audience.

      **Either way, the core idea MUST NOT change and the rest of the text must be kept as is. You are not allowed to change any other lines.**
      The hook MUST support the core idea and the rest of the text.

      # HOOK RULES
      • ≤ 15 words  
      • Must slam reader curiosity, emotion, or tension (hit at least one)  
      • Conversational voice—no corporate fluff, no jargon

      # HOW TO SCORE STOP-POWER (1–10)
      Rate the existing first 1–2 lines with this checklist. Each yes = +2 points (max 10).

      1. Shock or surprise?  
      2. Clear tension or open loop?  
      3. Specific, vivid detail or number?  
      4. Is the hook cliché? (Less cliché is better)
      5. Directly calls out or implicates the reader?  
      6. Fresh angle or phrasing (not tired clickbait)?

      Map total to final score:

      0–1 → 1  
      2 → 2  
      3 → 3  
      4 → 4  
      5–6 → 5  
      7–8 → 6  
      9–10 → 7–10 (10 only if every box is a hell-yes)

      If score < 7, replace the hook.

      # PROCESS
      1. Extract the first 1–2 lines as the “existing hook.”  
      2. Apply the scoring rubric.  
      3. If < 7, craft a new hook obeying Hook Rules.  
      4. If ≥ 7, tighten it (shorten, punch up wording, add specificity) but keep core idea.  
      5. Keep the rest of the Note intact unless a tiny edit is needed for flow.
      `,
  },
};

const titleImprovementPromptTemplates: {
  [key: string]: {
    task: string;
    prompt: string;
    model?: Model;
  };
} = {
  catchy: {
    task: "make the title catchier",
    prompt: `You are an expert title writer. Enhance the user's title to be more catchy and memorable, ensuring it grabs attention and reflects the article's essence. Use creative language and compelling phrasing.`,
  },
  "better hook": {
    task: "improve the title with a better hook",
    prompt: `You are a creative copywriter. Revise the user's title to incorporate a more compelling hook that immediately engages the reader, while keeping it concise and relevant to the article's content.`,
  },
  clearer: {
    task: "make the title clearer",
    prompt: `You are a clear communicator. Refine the user's title to ensure it clearly conveys the main message of the article, eliminating any ambiguity or confusion. Focus on precision and clarity.`,
  },
  generate: {
    task: "generate a title",
    prompt: `You are an expert writer and marketing guru. Generate a title for the user's article that is engaging and relevant to the article's content.`,
  },
};

const subtitleImprovementPromptTemplates: {
  [key: string]: {
    task: string;
    prompt: string;
    model?: Model;
  };
} = {
  expand: {
    task: "expand on the title",
    prompt: `You are an expert writer. Enhance the user's subtitle by expanding on the title, providing additional details and depth that add context and intrigue to the article.`,
  },
  engaging: {
    task: "make the subtitle more engaging",
    prompt: `You are an engaging storyteller. Revise the user's subtitle to make it more captivating and appealing, drawing readers in and complementing the title with lively language.`,
  },
  context: {
    task: "add context to the subtitle",
    prompt: `You are an insightful writer. Improve the user's subtitle by adding relevant context that clarifies the article's theme and supports the title effectively. Ensure the subtitle provides a clear, informative backdrop to the article.`,
  },
  generate: {
    task: "generate a subtitle",
    prompt: `You are an expert writer and marketing guru. Generate a subtitle for the user's article that is engaging and relevant to the article's content.`,
  },
};

/**
 * FREE LEADMAGNETS PROMPTS
 */

export const generateTeaserNotesPrompt = ({
  userNotes,
  articlesBody,
  options = {
    noteCount: 3,
    maxLength: 280,
  },
}: {
  userNotes: string[];
  articlesBody: string[];
  options: {
    noteCount?: number;
    maxLength?: number;
  };
}) => {
  /* ─── Defaults ─── */
  const { noteCount = 1, maxLength = 280 } = options;

  /* ─── Stats ─── */
  const avgLen = userNotes.length
    ? Math.round(userNotes.reduce((s, n) => s + n.length, 0) / userNotes.length)
    : 160;

  // ±20 %, never < 30
  const lenFloor = Math.max(30, Math.round(avgLen * 0.2));
  const lenCeil = Math.min(maxLength, Math.round(avgLen * 1.4));

  const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Component})/gu;
  const emojiHits = userNotes.reduce(
    (c, n) => c + (emojiRegex.test(n) ? 1 : 0),
    0,
  );
  const emojiRatio = emojiHits / Math.max(1, userNotes.length);

  /* ─── Style Snapshot ─── */
  const styleSnapshot = `
User style snapshot
- Avg length ${lenFloor}-${lenCeil} chars
- Emoji ratio ${emojiRatio.toFixed(2)}
`.trim();

  /* ─── System Message ─── */
  const systemMessage = `
You are an outlaw-level Substack note ghostwriter.

${styleSnapshot}

MISSION
Craft ${noteCount} short notes that act as ruthless teasers, yanking readers in without spilling the guts of the articles.

RULES
1. Exactly ${noteCount} notes, no extras.
2. ${lenFloor}-${lenCeil} characters each (spaces count).
3. NO hashtags, colons in hooks, or em dashes.
4. If emojiRatio ≤ 0.20 → zero emojis. Else match ratio, never exceed it.
5. Use "\\n\\n" for EVERY line break. Never output a lone newline.
6. Each note must:
   • Open with a punch-in-the-face hook (question, bold claim, or wild stat).
   • Reveal just enough to spark FOMO—never spoil the article.
   • End with an implicit invitation to “see what’s inside” (no direct CTA text).
7. Twist every borrowed idea ≥ 40 % so it’s fresh as roadkill on a July highway.
8. HARD LIMIT: any note > ${lenCeil} chars is invalid. Regenerate until it fits.
9. Output ONLY a JSON array in this schema:
[
  {
    "body": "<Generated note>",
    "summary": "<One-line what’s really inside (for the author only)>",
    "topics": ["<Topic 1>", "<Topic 2>", "<Topic 3>"],
    "inspiration": "<Short trace to article(s)>"
  }
]
All content must pull inspo ONLY from the provided articles.
`.trim();

  /* ─── User Message ─── */
  const userMessage = `
Articles:
${articlesBody.map((a, i) => `(${i + 1}) ${a}`).join("\n")}
`.trim();

  /* ─── Return chat prompt ─── */
  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
};

// generateSEOMetadataPrompt – creates messages for an LLM to craft
// an SEO‑optimised title, meta description and URL slug from a draft article.
// -----------------------------------------------------------------------------
// Design notes
// • Respects user quirks stored in userMetadata / publication (e.g. no colons
//   in titles, no em‑dashes, avoid word "embrace").
// • Allows an optional focusKeyword – if given, title + description must lead
//   with it.
// • Returns messages usable with OpenAI chat completions, expecting a JSON
//   response:
//   {
//     "title":        "...",
//     "description":  "...",
//     "slug":         "..."   // lower‑case, dash‑separated, no stop‑words
//   }
// -----------------------------------------------------------------------------

export interface SEOPromptOptions {
  maxTitleChars?: number; // default 60
  maxDescriptionChars?: number; // default 160
  focusKeyword?: string; // optional primary keyword
}

export const generateSEOMetadataPrompt = (
  articleBody: string,
  userMetadata?: UserMetadata | null,
  publication?: PublicationMetadata | null,
  options: SEOPromptOptions = {},
) => {
  const {
    maxTitleChars = 60,
    maxDescriptionChars = 160,
    focusKeyword = "",
  } = options;

  const systemMessage = `
${userMetadata?.noteWritingStyle || publication?.writingStyle || ""}

You are an expert SEO copywriter.

**Output requirements (top priority)**
1. Generate exactly one JSON object with keys: title, description, slug. No other text.
2. Title: ≤ ${maxTitleChars} characters (including spaces). Clear, compelling, no emojis, no colons, no em‑dashes, no semicolons. Capitalise major words. ${focusKeyword ? `Start with the keyword \"${focusKeyword}\".` : "Lead with the main topic."}
3. Description: 120‑${maxDescriptionChars} characters. Natural language, includes the focus keyword once (near start). Encourage click‑through but avoid clickbait clichés.
4. Slug: lowercase, dash‑separated, ASCII only, no stop words (the, a, an, of, to, and, for, with, in). Strip punctuation, trim to ≤ 8 words.
5. Never change author’s tone drastically – keep concise & direct.
6. Forbidden words: embrace.
7. Do not output colons, em‑dashes or semicolons anywhere.
8. If any field exceeds its limit, regenerate internally before responding.

Response MUST be in the following format:
{
  "title": <generated title>,
  "description": <generated description>,
  "slug": <generated slug>
}
`.trim();

  const userMessage = `
${focusKeyword ? `Primary keyword: ${focusKeyword}` : ""}

Draft article body:\n\n${articleBody}
`.trim();

  return [
    { role: "system", content: systemMessage },
    { role: "user", content: userMessage },
  ];
};
