import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(
        query + ' 편의점'
      )}&display=10&start=1&sort=random`,
      {
        headers: {
          'X-Naver-Client-Id': process.env.NEXT_PUBLIC_NAVER_OPEN_API_CLIENT_ID,
          'X-Naver-Client-Secret': process.env.NAVER_OPEN_API_CLIENT_SECRET,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch search results');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
} 