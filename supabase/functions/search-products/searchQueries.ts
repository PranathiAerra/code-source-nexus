
import { SearchParams, SearchResult } from "./types.ts";
import { transformProduct } from "./productTransformer.ts";

const productSources = [
  { tableName: 'amazon_products_1', transform: transformProduct.amazon },
  { tableName: 'amazon_products_2', transform: transformProduct.amazon },
  { tableName: 'flipkart_1', transform: transformProduct.flipkart },
  { tableName: 'flipkart_2', transform: transformProduct.flipkart },
  { tableName: 'fashion_1', transform: transformProduct.fashion }
];

export async function handleSearchQueries(
  supabase: any,
  params: SearchParams
): Promise<SearchResult> {
  const queries = buildQueries(supabase, params);
  const results = await Promise.all(queries);
  
  let allProducts: any[] = [];
  let totalCount = 0;

  results.forEach((result, index) => {
    if (result.error) throw result.error;
    
    const products = (result.data || []).map(productSources[index].transform);
    allProducts = [...allProducts, ...products];
    totalCount += result.count || 0;
  });

  // Apply price filters
  if (params.minPrice !== null && params.minPrice !== undefined) {
    allProducts = allProducts.filter(p => p.price >= params.minPrice);
  }
  if (params.maxPrice !== null && params.maxPrice !== undefined) {
    allProducts = allProducts.filter(p => p.price <= params.maxPrice);
  }

  // Sort combined results with reduced relevance boost (10%)
  sortProducts(allProducts, params);

  // Slice to match requested limit
  allProducts = allProducts.slice(0, params.limit);

  return { products: allProducts, totalCount };
}

function buildQueries(supabase: any, params: SearchParams) {
  if (!params.searchTerm || params.searchTerm.trim() === '') {
    return productSources.map(source => 
      supabase
        .from(source.tableName)
        .select('*', { count: 'exact' })
        .limit(params.limit / productSources.length)
    );
  }

  return productSources.map(source => {
    const query = supabase
      .from(source.tableName)
      .select('*', { count: 'exact' });

    if (source.tableName.startsWith('amazon')) {
      query.or(`Product Title.ilike.%${params.searchTerm}%,Brand.ilike.%${params.searchTerm}%,Category.ilike.%${params.searchTerm}%`);
    } else if (source.tableName.startsWith('flipkart')) {
      query.or(`product_name.ilike.%${params.searchTerm}%,brand.ilike.%${params.searchTerm}%`);
    } else {
      query.or(`name.ilike.%${params.searchTerm}%,brand.ilike.%${params.searchTerm}%`);
    }

    return query.range(params.offset, params.offset + params.limit - 1);
  });
}

function sortProducts(products: any[], params: SearchParams) {
  switch (params.sortBy) {
    case 'price-low':
      products.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      products.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      products.sort((a, b) => b.rating - a.rating);
      break;
    default:
      if (params.searchTerm && params.searchTerm.trim() !== '') {
        products.sort((a, b) => {
          const searchTerm = params.searchTerm.toLowerCase();
          const aMatch = a.name.toLowerCase().includes(searchTerm);
          const bMatch = b.name.toLowerCase().includes(searchTerm);
          
          // Reduce relevance boost from 100% to 10%
          if (aMatch && !bMatch) return -0.1;
          if (!aMatch && bMatch) return 0.1;
          return 0;
        });
      }
  }
}
