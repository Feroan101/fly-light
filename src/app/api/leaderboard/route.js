import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const filePath = path.join(process.cwd(), 'src', 'data', 'leaderboard.json');

export async function GET() {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read leaderboard data' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, data } = body;
    
    if (password !== 'flylight2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save leaderboard data' }, { status: 500 });
  }
}
