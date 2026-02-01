import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/drizzle';
import { products, aiGenerations } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { generateProductContent } from '@/services/ai';
import type { ApiResponse, AIGeneratedContent, AIGenerationRequest } from '@/types';

// ============================================
// POST /api/products/[id]/generate
// Generate AI content for a product
// ============================================

const generateSchema = z.object({
  targetAudience: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'luxury', 'playful']).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ content: AIGeneratedContent; generationId: number }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get the product
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.userId, user.id)
      ),
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const validation = generateSchema.safeParse(body);
    
    const options = validation.success ? validation.data : {};

    // Create generation record
    const [generation] = await db
      .insert(aiGenerations)
      .values({
        productId,
        status: 'processing',
      })
      .returning();

    try {
      // Generate AI content
      const generationRequest: AIGenerationRequest = {
        productId,
        title: product.title,
        originalDescription: product.description || '',
        targetAudience: options.targetAudience,
        tone: options.tone,
      };

      const result = await generateProductContent(generationRequest);

      // Update generation record with results
      await db
        .update(aiGenerations)
        .set({
          generatedContent: result.content,
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(aiGenerations.id, generation.id));

      // Update product with generated description
      await db
        .update(products)
        .set({
          description: result.content.description,
          status: 'generated',
          updatedAt: new Date(),
        })
        .where(eq(products.id, productId));

      return NextResponse.json({
        success: true,
        data: {
          content: result.content,
          generationId: generation.id,
        },
        message: 'Content generated successfully',
      });
    } catch (aiError) {
      // Update generation record with error
      const errorMessage = aiError instanceof Error ? aiError.message : 'AI generation failed';
      
      await db
        .update(aiGenerations)
        .set({
          status: 'failed',
          error: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(aiGenerations.id, generation.id));

      throw aiError;
    }
  } catch (error) {
    console.error('AI generation error:', error);
    
    const message = error instanceof Error ? error.message : 'Failed to generate content';
    
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/products/[id]/generate
// Get generation history for a product
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ generations: typeof aiGenerations.$inferSelect[] }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Verify product ownership
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.userId, user.id)
      ),
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get all generations for this product
    const generations = await db.query.aiGenerations.findMany({
      where: eq(aiGenerations.productId, productId),
      orderBy: (aiGenerations, { desc }) => [desc(aiGenerations.createdAt)],
    });

    return NextResponse.json({
      success: true,
      data: { generations },
    });
  } catch (error) {
    console.error('Get generations error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get generations' },
      { status: 500 }
    );
  }
}

