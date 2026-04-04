import { NextResponse } from 'next/server';
import { getAllObservatoryProjects, approveProject, rejectProject, updateProject, deleteProject } from '@/services/projects';

export async function GET() {
  try {
    const projects = await getAllObservatoryProjects();
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json();
    if (action === 'approve') {
      const project = await approveProject(id);
      return NextResponse.json(project);
    } else if (action === 'reject') {
      await rejectProject(id);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, updates } = await request.json();
    const updated = await updateProject(id, updates);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is missing' }, { status: 400 });

    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
