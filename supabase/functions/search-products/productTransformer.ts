const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

// Helper function to clean and validate image URLs
const cleanImageUrl = (imageUrl: string | null): string => {
  const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';
  
  try {
    if (!imageUrl) return fallbackImage;

    // Handle JSON string arrays
    if (imageUrl.startsWith('[')) {
      try {
        const urls = JSON.parse(imageUrl);
        return Array.isArray(urls) && urls.length > 0 ? urls[0] : fallbackImage;
      } catch {
        return fallbackImage;
      }
    }

    // Handle pipe-separated URLs (from Amazon dataset)
    if (imageUrl.includes('|')) {
      const urls = imageUrl.split('|');
      return urls[0] || fallbackImage;
    }

    // Handle JSONB format (from Flipkart dataset)
    if (typeof imageUrl === 'object') {
      const values = Object.values(imageUrl);
      return values.length > 0 && typeof values[0] === 'string' ? values[0] : fallbackImage;
    }

    // Handle base64 images
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    // Handle relative URLs
    if (imageUrl.startsWith('/')) {
      return `https://example.com${imageUrl}`;
    }

    return imageUrl;
  } catch (error) {
    console.error('Error processing image URL:', error);
    return fallbackImage;
  }
};

export const transformProduct = {
  amazon: (product: any) => {
    try {
      const imageUrl = cleanImageUrl(product['Image Urls']);
      console.log(`Amazon image URL: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`);
      
      return {
        id: product['Unique ID'] || String(Math.random()),
        name: product['Product Title'] || 'Unknown Product',
        price: typeof product.Price === 'number' ? product.Price : parseFloat(product.Price?.replace(/[^0-9.]/g, '')) || 0,
        originalPrice: typeof product.Mrp === 'number' ? product.Mrp : parseFloat(product.Mrp?.replace(/[^0-9.]/g, '')) || 0,
        image: imageUrl,
        rating: Math.floor(Math.random() * 2) + 3.5,
        store: product['Site Name'] || 'Amazon In',
        storeUrl: 'https://www.amazon.in',
        offer: product.Offers || null
      };
    } catch (error) {
      console.error("Error transforming Amazon product:", error);
      return {
        id: String(Math.random()),
        name: product['Product Title'] || 'Unknown Product',
        price: 0,
        originalPrice: 0,
        image: fallbackImage,
        rating: 3.5,
        store: 'Amazon In',
        storeUrl: 'https://www.amazon.in',
        offer: null
      };
    }
  },

  flipkart: (product: any) => {
    try {
      const imageUrl = cleanImageUrl(product.image);
      console.log(`Flipkart image URL: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`);
      
      return {
        id: product.uniq_id || String(Math.random()),
        name: product.product_name || 'Unknown Product',
        price: parseFloat(product.discounted_price?.replace(/[^0-9.]/g, '')) || 0,
        originalPrice: parseFloat(product.retail_price?.replace(/[^0-9.]/g, '')) || 0,
        image: imageUrl,
        rating: parseFloat(product.product_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
        store: 'Flipkart',
        storeUrl: 'https://www.flipkart.com',
        offer: product.discounted_price && product.retail_price ? 
          `${Math.round(((parseFloat(product.retail_price.replace(/[^0-9.]/g, '')) - 
          parseFloat(product.discounted_price.replace(/[^0-9.]/g, ''))) / 
          parseFloat(product.retail_price.replace(/[^0-9.]/g, ''))) * 100)}%` : null
      };
    } catch (error) {
      console.error("Error transforming Flipkart product:", error);
      return {
        id: String(Math.random()),
        name: product.product_name || 'Unknown Product',
        price: 0,
        originalPrice: 0,
        image: fallbackImage,
        rating: 3.5,
        store: 'Flipkart',
        storeUrl: 'https://www.flipkart.com',
        offer: null
      };
    }
  },

  fashion: (product: any) => {
    try {
      const imageUrl = cleanImageUrl(product.img);
      console.log(`Fashion image URL: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`);
      
      return {
        id: String(product.p_id || Math.random()),
        name: product.name || 'Unknown Product',
        price: product.price || 0,
        originalPrice: product.price || 0,
        image: imageUrl,
        rating: parseFloat(product.avg_rating || '0') || Math.floor(Math.random() * 2) + 3.5,
        store: product.brand || 'Fashion Store',
        storeUrl: 'https://www.myntra.com',
        offer: null
      };
    } catch (error) {
      console.error("Error transforming Fashion product:", error);
      return {
        id: String(Math.random()),
        name: product.name || 'Unknown Product',
        price: 0,
        originalPrice: 0,
        image: fallbackImage,
        rating: 3.5,
        store: product.brand || 'Fashion Store',
        storeUrl: 'https://www.myntra.com',
        offer: null
      };
    }
  }
};
