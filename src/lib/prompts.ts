import { Article } from "@/models/article";
import { PublicationMetadata } from "@prisma/client";

export const generateOutlinePrompt = (
  title: string,
  subtitle: string,
  publicationDescription: string,
  topArticles: Article[],
) => [
  {
    role: "system",
    content: `
     You are an expert articles writer and your expertise is guided by the following publication description:
      "${publicationDescription}"

      The user will provide 5 top articles. 
      Use the editorial focus and style implied by the publication description to ensure your outline aligns with the brand's voice and target audience.

      The premise of the new article is: "${title}" and "${subtitle}"

      Based on the knowledge and style from these 5 articles—and the editorial direction from the publication—craft a detailed outline for the new article. 
      Use headings (h2 to h6) and provide brief notes or bullet points under each heading to clarify what belongs there. 

      Don't include the title of the article in the outline (h1).

      **Write in a human, natural voice that doesn't sound AI-generated.**

      The response should be in .md format.

      The response should always be structured in the following JSON format, without any other text or formatting:
      {"outline": "<generated outline>"}
    `,
  },
  {
    role: "user",
    content: `
      Top Articles:
      ${topArticles.map((article, index) => `Article ${index + 1}: ${article.body_text}`).join("\n")}
    `,
  },
];

export const generateIdeasPrompt = (
  publication: PublicationMetadata,
  articles: Article[],
  inspirations: {
    title: string;
    subtitle: string;
  }[] = [],
) => [
  {
    role: "system",
    content: `
    ${publication.generatedDescription}

    ${publication.writingStyle}
    
    Analyze the user's previous articles and the description of their publications.
    Based on this analysis, generate a list of original, and engaging article ideas that can resemble the inspiration ones,
    but align with the publication description.

    Use the user's articles to avoid repeating the exact same ideas.

    Ensure that the ideas are diverse in topics and formats, incorporating current trends and emerging themes relevant to the user's audience.
    For each idea, provide a brief summary that highlights the key angle, potential insights, and why it would resonate with readers.
    Include at least 10 distinct article ideas.

    Write with human-writing style, natural language, and avoid sounding like AI generated.

    Use inspirations to generate good ideas, titles and subtitles.

    For each idea, you should provide the following information:
    - Name of the article
    - Title
    - Subtitle

    The response should always be structured in the following JSON format, without any other text or formatting:
  [{
      "name": "<generated name>",
      "title": "<generated title>",
      "subtitle": "<generated subtitle>"
  }]
    `,
  },
  {
    role: "user",
    content: `
    Publication Description: ${publicationDescription}
    User's articles: ${articles.map((article, index) => `Article ${index + 1}: Title: ${article.title}, Subtitle: ${article.subtitle}`).join("\n")}

    Inspirations:
    ${inspirations.map((inspiration, index) => `Inspiration ${index + 1}: ${inspiration.title} - ${inspiration.subtitle}`).join("\n")}
    `,
  },
];

export const generateDescriptionPrompt = (
  description: string,
  topArticles: Article[],
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

The response should always be structured in JSON format, with proper escape string for clarity and consistency. Here is an example of the JSON response expected:
{
  "about": "<generated about them>",
  "topics": "<generated topics>",
  "writingStyle": "<generated writing style>"
}
    `,
  },
  {
    role: "user",
    content: `
      Description: ${description}
      Top Articles: ${topArticles.map((article, i) => `Article ${i + 1}: Title: ${article.title} \n Subtitle: ${article.subtitle} \n Body: ${article.body_text}`).join("\n")}
    `,
  },
];

const promptTemplates = {
  improve: {
    task: "make it better",
    prompt: `Act like a seasoned editor and improve the user's article.`,
  },
  grammar: {
    task: "improve user's article",
    prompt: `You are a proficient editor, correct any grammatical, punctuation, or syntax errors in the user's article. Preserve the original tone and intent while ensuring the text flows naturally. The final version should read as if written effortlessly by a native speaker, without any signs of AI involvement.`,
  },
  translate: {
    model: "gpt-4o-mini",
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
