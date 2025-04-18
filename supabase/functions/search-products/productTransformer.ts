
const fallbackImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e';

export const transformProduct = {
  amazon: (product: any) => {
    try {
      const imageUrl = product['Image Urls'] || fallbackImage;
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
      // Handle Flipkart image which could be a JSON string array or direct string
      let imageUrl = fallbackImage;
      
      if (product.image) {
        if (typeof product.image === 'string') {
          // Try to parse if it's a JSON string
          try {
            const parsed = JSON.parse(product.image);
            imageUrl = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : fallbackImage;
          } catch {
            imageUrl = product.image;
          }
        } else if (Array.isArray(product.image)) {
          imageUrl = product.image[0] || fallbackImage;
        } else if (typeof product.image === 'object') {
          // It might already be parsed as an object by Supabase
          const values = Object.values(product.image);
          imageUrl = values.length > 0 && typeof values[0] === 'string' ? values[0] : fallbackImage;
        }
      }
      
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
      const imageUrl = product.img || fallbackImage;
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
