import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: cartItems, error } = await supabase
      .from('cart_items')
      .select('*, courses(id, title, thumbnail_url, level, is_published)')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List cart error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(cartItems || []);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 });
    }

    // Check if user already owns the course
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('profile_id', user.id)
      .eq('course_id', course_id)
      .maybeSingle();
      
    if (enrollment) {
      return NextResponse.json({ error: 'Você já possui este curso.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .insert({ profile_id: user.id, course_id })
      .select()
      .single();

    if (error) {
      // Handle the unique constraint duplicate error gracefully
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Item já está no carrinho' }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const course_id = searchParams.get('course_id');
    const id = searchParams.get('id');

    if (!course_id && !id) {
      return NextResponse.json({ error: 'course_id or id is required' }, { status: 400 });
    }

    let query = supabase.from('cart_items').delete().eq('profile_id', user.id);
    
    if (course_id) {
      query = query.eq('course_id', course_id);
    } else if (id) {
      query = query.eq('id', id);
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
