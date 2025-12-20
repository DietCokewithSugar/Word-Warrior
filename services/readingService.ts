import { supabase } from './supabaseClient';
import { ReadingMaterial } from '../types';

export const readingService = {
    // Fetch all reading materials (summary only)
    async getReadingMaterials(): Promise<ReadingMaterial[]> {
        const { data, error } = await supabase
            .from('reading_materials')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching reading materials:', error);
            throw error;
        }

        return data || [];
    },

    // Fetch a single reading material by ID
    async getReadingMaterialById(id: string): Promise<ReadingMaterial | null> {
        const { data, error } = await supabase
            .from('reading_materials')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Error fetching reading material with id ${id}:`, error);
            throw error;
        }

        return data;
    }
};
