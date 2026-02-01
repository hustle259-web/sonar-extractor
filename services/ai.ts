import OpenAI from 'openai';
import type { 
  AIGeneratedContent, 
  AIGenerationRequest, 
  FAQItem 
} from '@/types';

// ============================================
// AI Generation Service
// ============================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GenerationResult {
  content: AIGeneratedContent;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Generate AI content for a product
 */
export async function generateProductContent(
  request: AIGenerationRequest
): Promise<GenerationResult> {
  const { title, originalDescription, targetAudience, tone } = request;

  const systemPrompt = buildSystemPrompt(tone);
  const userPrompt = buildUserPrompt(title, originalDescription, targetAudience);

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content generated from AI');
  }

  const parsed = JSON.parse(content) as AIGeneratedContent;

  // Validate the response structure
  validateGeneratedContent(parsed);

  return {
    content: parsed,
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
  };
}

/**
 * Generate product description only
 */
export async function generateDescription(
  title: string,
  originalDescription: string,
  tone: AIGenerationRequest['tone'] = 'professional'
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert e-commerce copywriter. Write compelling product descriptions that convert visitors into buyers. Use a ${tone} tone.`,
      },
      {
        role: 'user',
        content: `Write a compelling product description for:
        
Title: ${title}
Original Description: ${originalDescription}

Requirements:
- 2-3 paragraphs
- Highlight key benefits
- Use persuasive language
- Include a call to action`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate bullet points for product features
 */
export async function generateBulletPoints(
  title: string,
  description: string,
  count: number = 5
): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert e-commerce copywriter. Generate concise, benefit-focused bullet points.',
      },
      {
        role: 'user',
        content: `Generate ${count} bullet points for this product:

Title: ${title}
Description: ${description}

Requirements:
- Start each bullet with a strong action verb or benefit
- Keep each bullet under 100 characters
- Focus on customer benefits, not just features
- Return as a JSON array of strings`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed.bullets) ? parsed.bullets : [];
}

/**
 * Generate FAQ items for a product
 */
export async function generateFAQ(
  title: string,
  description: string,
  count: number = 5
): Promise<FAQItem[]> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an expert e-commerce copywriter. Generate helpful FAQ items that address common customer concerns.',
      },
      {
        role: 'user',
        content: `Generate ${count} FAQ items for this product:

Title: ${title}
Description: ${description}

Requirements:
- Address common customer questions
- Include questions about shipping, returns, and product details
- Keep answers concise but helpful
- Return as JSON with format: { "faq": [{ "question": "...", "answer": "..." }] }`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 800,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return Array.isArray(parsed.faq) ? parsed.faq : [];
}

/**
 * Generate SEO metadata for a product
 */
export async function generateSEO(
  title: string,
  description: string
): Promise<{ seoTitle: string; seoDescription: string; tags: string[] }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are an SEO expert. Generate optimized metadata for e-commerce products.',
      },
      {
        role: 'user',
        content: `Generate SEO metadata for this product:

Title: ${title}
Description: ${description}

Requirements:
- SEO title: 50-60 characters, include main keyword
- SEO description: 150-160 characters, compelling and keyword-rich
- Tags: 5-10 relevant tags for the product
- Return as JSON with format: { "seoTitle": "...", "seoDescription": "...", "tags": [...] }`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { seoTitle: title, seoDescription: description.slice(0, 160), tags: [] };
  }

  const parsed = JSON.parse(content);
  return {
    seoTitle: parsed.seoTitle || title,
    seoDescription: parsed.seoDescription || description.slice(0, 160),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}

/**
 * Build system prompt based on tone
 */
function buildSystemPrompt(tone: AIGenerationRequest['tone'] = 'professional'): string {
  const toneDescriptions = {
    professional: 'professional, trustworthy, and informative',
    casual: 'friendly, conversational, and approachable',
    luxury: 'sophisticated, exclusive, and premium',
    playful: 'fun, energetic, and engaging',
  };

  return `You are an expert e-commerce copywriter and SEO specialist. 
Your task is to generate compelling product content that converts visitors into buyers.
Use a ${toneDescriptions[tone || 'professional']} tone.

Always respond with valid JSON in this exact format:
{
  "description": "2-3 paragraph product description",
  "bulletPoints": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "faq": [
    { "question": "Question 1?", "answer": "Answer 1" },
    { "question": "Question 2?", "answer": "Answer 2" },
    { "question": "Question 3?", "answer": "Answer 3" }
  ],
  "seoTitle": "SEO optimized title (50-60 chars)",
  "seoDescription": "SEO meta description (150-160 chars)",
  "tags": ["tag1", "tag2", "tag3"]
}`;
}

/**
 * Build user prompt for content generation
 */
function buildUserPrompt(
  title: string,
  originalDescription: string,
  targetAudience?: string
): string {
  let prompt = `Generate complete product content for:

Product Title: ${title}

Original Description: ${originalDescription}`;

  if (targetAudience) {
    prompt += `\n\nTarget Audience: ${targetAudience}`;
  }

  prompt += `

Requirements:
- Description: 2-3 compelling paragraphs highlighting benefits and features
- Bullet Points: 5 benefit-focused points, each under 100 characters
- FAQ: 5 common questions with helpful answers
- SEO Title: 50-60 characters with main keyword
- SEO Description: 150-160 characters, compelling meta description
- Tags: 5-10 relevant product tags`;

  return prompt;
}

/**
 * Validate generated content structure
 */
function validateGeneratedContent(content: unknown): asserts content is AIGeneratedContent {
  const c = content as Record<string, unknown>;
  
  if (typeof c.description !== 'string') {
    throw new Error('Invalid generated content: missing description');
  }
  
  if (!Array.isArray(c.bulletPoints)) {
    throw new Error('Invalid generated content: missing bulletPoints');
  }
  
  if (!Array.isArray(c.faq)) {
    throw new Error('Invalid generated content: missing faq');
  }
  
  if (typeof c.seoTitle !== 'string') {
    throw new Error('Invalid generated content: missing seoTitle');
  }
  
  if (typeof c.seoDescription !== 'string') {
    throw new Error('Invalid generated content: missing seoDescription');
  }
  
  if (!Array.isArray(c.tags)) {
    throw new Error('Invalid generated content: missing tags');
  }
}

export default {
  generateProductContent,
  generateDescription,
  generateBulletPoints,
  generateFAQ,
  generateSEO,
};

