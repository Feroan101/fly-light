import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'gallery.json');
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function GET() {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read gallery data' }, { status: 500 });
  }
}

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
    const filename = `gallery-${Date.now()}${ext}`;
    const filePath = path.join(uploadDir, filename);

    // Save file to public/uploads
    await fs.writeFile(filePath, buffer);
    const webPath = `/uploads/${filename}`;

    // Update gallery.json
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const images = JSON.parse(data);
    images.unshift(webPath); // Insert at the beginning of the array
    await fs.writeFile(dataFilePath, JSON.stringify(images, null, 2), 'utf-8');

    return NextResponse.json({ success: true, image: webPath });
  } catch (error) {
    console.error('Image upload API error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { password, imagePath } = body;

    if (password !== 'flylight2026') {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Update gallery.json
    const data = await fs.readFile(dataFilePath, 'utf-8');
    let images = JSON.parse(data);
    images = images.filter((img) => img !== imagePath);
    await fs.writeFile(dataFilePath, JSON.stringify(images, null, 2), 'utf-8');

    // Attempt to delete file from disk if it is in the uploads folder
    if (imagePath.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', imagePath);
      try {
        await fs.unlink(diskPath);
      } catch (err) {
        console.warn(`File could not be deleted from disk: ${diskPath}`, err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image delete API error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
