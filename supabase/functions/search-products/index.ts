
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";
import { transformProduct } from "./productTransformer.ts";
import { handleSearchQueries } from "./searchQueries.ts";
import type { SearchParams, ProductSource } from "./types.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const params: SearchParams = await req.json();
    console.log("Search parameters:", JSON.stringify(params, null, 2));

    const { products, totalCount } = await handleSearchQueries(supabase, params);
    
    console.log(`Found ${products.length} products out of ${totalCount} total`);

    return new Response(
      JSON.stringify({ products, total: totalCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
