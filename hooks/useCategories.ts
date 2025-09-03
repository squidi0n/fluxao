'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: {
    posts: number;
  };
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data: CategoriesResponse = await response.json();
        setCategories(data.categories);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: () => {
      setLoading(true);
      fetchCategories();
    }
  };
}