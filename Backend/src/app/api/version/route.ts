import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0,7) ?? 'local',
    branch: process.env.VERCEL_GIT_COMMIT_REF ?? 'local',
    url: process.env.VERCEL_URL ?? 'localhost',
    at: new Date().toISOString(),
  });
}
