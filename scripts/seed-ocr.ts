import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    console.log('Seeding OCR Engagement Training content...');

    // 1. Create Folder
    const { data: folderData, error: folderError } = await supabase
        .from('syllabus_content')
        .insert({
            content_type: 'folder',
            title: 'OCR Engagement Training',
            content: 'OCR',
            module_id: 'folder-config',
            topic_code: 'FOLDER-OCR',
        })
        .select();

    if (folderError) {
        console.error('Error creating folder:', folderError);
    } else {
        console.log('Folder created:', folderData[0].title);
    }

    // 2. Add Videos
    const videos = [
        {
            topic_code: 'OCR-DYN-1',
            module_id: 'OCR_ENGAGEMENT',
            title: 'WALLET- BASIC TRAINING BY ANAM',
            content_type: 'video',
            content: 'https://drive.google.com/file/d/1xrks81pbX0Dk0C100GWttqyOqsauGuLm/view?usp=sharing'
        },
        {
            topic_code: 'OCR-DYN-2',
            module_id: 'OCR_ENGAGEMENT',
            title: 'WALLET ENGAGEMENT- VAISHNAVI & KAJAL TRAINING',
            content_type: 'video',
            content: 'https://drive.google.com/file/d/1NPpF5xnFrBUhlrQQqXCr_KosfGgCYGzF/view?usp=sharing'
        },
        {
            topic_code: 'OCR-DYN-3',
            module_id: 'OCR_ENGAGEMENT',
            title: 'PLATINUM, PREGNANCY TRAINING',
            content_type: 'video',
            content: 'https://drive.google.com/file/d/1sT9JLq-Y8O0RJn5fARZptsF-F-ad95-C/view'
        },
        {
            topic_code: 'OCR-DYN-4',
            module_id: 'OCR_ENGAGEMENT',
            title: 'OCR ENGAGEMENT MEET (Passcode: %Y+nJ49Y)',
            content_type: 'video',
            content: 'https://us06web.zoom.us/rec/share/Jb512O55-LZrLAyb1RyYwtOpf0mwWLYgVQJJQTyw7I7oK9nxUabdVZzrtM5FtHSM.UFfAw5Pf4P82M9i-'
        }
    ];

    for (const v of videos) {
        const { data, error } = await supabase
            .from('syllabus_content')
            .upsert({
                ...v,
                updated_at: new Date().toISOString()
            })
            .select();

        if (error) {
            console.error(`Error adding ${v.title}:`, error);
        } else {
            console.log('Added:', data[0].title);
        }
    }

    console.log('Seeding complete.');
}

seed();
