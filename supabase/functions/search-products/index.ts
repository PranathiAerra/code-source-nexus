
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request
    const { searchTerm, minPrice, maxPrice, sortBy, sortOrder, limit = 20, offset = 0 } = await req.json();

    console.log("Search request:", { searchTerm, minPrice, maxPrice, sortBy, sortOrder, limit, offset });

    // Start with base query for amazon_products_2 (numeric price values)
    let query = supabase
      .from('amazon_products_2')
      .select('*', { count: 'exact' })
      .limit(limit)
      .range(offset, offset + limit - 1)
      .order(sortBy || 'Price', { ascending: sortOrder === 'asc' });

    // Apply search filter if provided using more comprehensive search across multiple fields
    if (searchTerm && searchTerm.trim() !== '') {
      // Build search conditions for multiple fields
      query = query.or(
        `Product Title.ilike.%${searchTerm}%,Product Description.ilike.%${searchTerm}%,Brand.ilike.%${searchTerm}%,Category.ilike.%${searchTerm}%`
      );
    }

    // Apply price range filters if provided
    if (minPrice !== undefined && minPrice !== null) {
      query = query.gte('Price', minPrice);
    }
    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.lte('Price', maxPrice);
    }

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log(`Found ${data?.length || 0} products out of ${count || 0} total`);

    if (!data || data.length === 0) {
      // If no products found with current search, try to find similar products
      // based on category if searchTerm contains any category information
      let similarProducts = [];
      
      if (searchTerm) {
        // Try to find products with similar category
        const { data: categoryData } = await supabase
          .from('amazon_products_2')
          .select('Category')
          .ilike('Product Title', `%${searchTerm}%`)
          .limit(1);
          
        if (categoryData && categoryData.length > 0 && categoryData[0].Category) {
          const { data: similarData } = await supabase
            .from('amazon_products_2')
            .select('*')
            .eq('Category', categoryData[0].Category)
            .limit(4);
            
          similarProducts = similarData || [];
        }
      }
      
      // Transform similar products data for frontend
      const suggestedProducts = similarProducts.map(product => ({
        id: product['Unique ID'] || String(Math.random()),
        name: product['Product Title'] || 'Unknown Product',
        price: product['Price'] || 0,
        originalPrice: product['Mrp'] || null,
        image: product['Image Urls'] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        rating: Math.floor(Math.random() * 2) + 3.5, // Mock rating between 3.5-5.0
        store: product['Site Name'] || 'Unknown Store',
        storeUrl: '#',
        offer: product['Offers'] || null
      }));
      
      return new Response(
        JSON.stringify({ 
          products: [], 
          total: 0, 
          suggestedProducts
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    // Transform data for frontend consumption
    const products = data.map(product => ({
      id: product['Unique ID'] || String(Math.random()),
      name: product['Product Title'] || 'Unknown Product',
      price: product['Price'] || 0,
      originalPrice: product['Mrp'] || null,
      image: product['Image Urls'] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      rating: Math.floor(Math.random() * 2) + 3.5, // Mock rating between 3.5-5.0 until we have real ratings
      store: product['Site Name'] || 'Unknown Store',
      storeUrl: '#',
      offer: product['Offers'] || null
    }));

    console.log(`Returning ${products.length} products with total count ${count}`);

    return new Response(
      JSON.stringify({ products, total: count || products.length }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
