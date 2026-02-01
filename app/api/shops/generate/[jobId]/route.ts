import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { generationJobs } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import type { ApiResponse } from '@/types';

// ============================================
// GET /api/shops/generate/[jobId]
// Get a specific generation job status
// ============================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse<{ job: typeof generationJobs.$inferSelect }>>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const id = parseInt(jobId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const job = await db.query.generationJobs.findFirst({
      where: and(
        eq(generationJobs.id, id),
        eq(generationJobs.userId, user.id)
      ),
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { job },
    });
  } catch (error) {
    console.error('Get job error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to get job' },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE /api/shops/generate/[jobId]
// Cancel a generation job
// ============================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse<ApiResponse>> {
  try {
    const user = await getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { jobId } = await params;
    const id = parseInt(jobId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const job = await db.query.generationJobs.findFirst({
      where: and(
        eq(generationJobs.id, id),
        eq(generationJobs.userId, user.id)
      ),
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending or processing jobs
    if (job.status !== 'pending' && job.status !== 'processing') {
      return NextResponse.json(
        { success: false, error: 'Job cannot be cancelled' },
        { status: 400 }
      );
    }

    await db
      .update(generationJobs)
      .set({
        status: 'failed',
        error: 'Cancelled by user',
        updatedAt: new Date(),
      })
      .where(eq(generationJobs.id, id));

    return NextResponse.json({
      success: true,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}

