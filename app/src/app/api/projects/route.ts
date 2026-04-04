import { NextResponse } from 'next/server';
import { getProjects, submitProject } from '@/services/projects';
import { SubmitProjectSchema } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';

    const projects = await getProjects(status);
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = SubmitProjectSchema.parse(body);
    const project = await submitProject(validatedData);
    
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
