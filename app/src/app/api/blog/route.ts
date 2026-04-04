import { NextResponse } from 'next/server';
import { getPosts, createPost } from '@/services/blog';
import { CreateBlogPostSchema } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'published';

    const posts = await getPosts(status);
    return NextResponse.json(posts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateBlogPostSchema.parse(body);
    const post = await createPost(validatedData);
    
    return NextResponse.json(post, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
