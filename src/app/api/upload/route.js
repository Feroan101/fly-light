import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const password = formData.get('password');
    const file = formData.get('file');

    if (password !== 'flylight2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Read the file data
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate unique name
    const ext = path.extname(file.name) || '.jpg';
    const filename = `avatar-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to public/uploads
    await fs.writeFile(filePath, buffer);
    const webPath = `/uploads/${filename}`;

    return NextResponse.json({ success: true, url: webPath });
  } catch (error) {
    console.error('Avatar upload API error:', error);
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
  }
}
