import { createClient } from '@/utils/supabase/server'
import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient();

    const { data: notes } = await supabase
        .from('notes')
        .select('slug, created_at')
        .eq('public', true)
        .order('created_at', { ascending: false });

    const notesUrls = notes?.map((note) => ({
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/notes/${note.slug}`,
        lastModified: new Date(note.created_at),
    })) || [];

    return [
        {
            url: process.env.NEXT_PUBLIC_SITE_URL!,
            lastModified: new Date(),
        },
        {
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/notes`,
            lastModified: new Date(),
        },
        ...notesUrls
    ]
}