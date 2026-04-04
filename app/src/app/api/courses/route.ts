import { NextResponse } from 'next/server';
import { getCourses, createCourse } from '@/services/courses';
import { CreateCourseSchema } from '@/lib/schemas';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('all') !== 'true';

    const courses = await getCourses(publishedOnly);
    return NextResponse.json(courses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = CreateCourseSchema.parse(body);
    const course = await createCourse(validatedData);
    
    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
