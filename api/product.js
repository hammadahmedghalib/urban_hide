<<<<<<< HEAD
import { neon } from '@neondatabase/serverless';

// Vercel automatically reads DATABASE_URL from the Environment Variables
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers (allows your frontend to talk to the backend securely)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // GET: Load all products for the website
  // ==========================================
  if (req.method === 'GET') {
    try {
      const products = await sql`SELECT * FROM products ORDER BY id DESC`;
      const settings = await sql`SELECT * FROM settings WHERE id = 1`;
      
      // Format database columns (snake_case) to match frontend (camelCase)
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        oldPrice: p.old_price ? Number(p.old_price) : null,
        image: p.image,
        description: p.description,
        sizes: p.sizes || [],
        featured: p.featured,
        inStock: p.in_stock,
        badge: p.badge
      }));

      const formattedSettings = {
        whatsappNumber: settings[0].whatsapp_number,
        phoneDisplay: settings[0].phone_display,
        address: settings[0].address,
        currency: settings[0].currency,
        currencySymbol: settings[0].currency_symbol
      };

      return res.status(200).json({ products: formattedProducts, settings: formattedSettings });
    } catch (error) {
      console.error("GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // POST: Save (Add or Edit) data from Admin
  // ==========================================
  if (req.method === 'POST') {
    try {
      const p = req.body;
      await sql`
        INSERT INTO products (id, name, category, price, old_price, image, description, sizes, featured, in_stock, badge)
        VALUES (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.oldPrice || null}, ${p.image}, ${p.description}, ${p.sizes}, ${p.featured}, ${p.inStock}, ${p.badge || null})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, 
          category = EXCLUDED.category, 
          price = EXCLUDED.price, 
          old_price = EXCLUDED.old_price, 
          image = EXCLUDED.image, 
          description = EXCLUDED.description,
          sizes = EXCLUDED.sizes, 
          featured = EXCLUDED.featured, 
          in_stock = EXCLUDED.in_stock, 
          badge = EXCLUDED.badge;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // DELETE: Remove a product from Admin
  // ==========================================
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Product ID required" });

      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("DELETE Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // If method is not GET, POST, or DELETE
  return res.status(405).json({ error: 'Method not allowed' });
=======
import { neon } from '@neondatabase/serverless';

// Vercel automatically reads DATABASE_URL from the Environment Variables
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers (allows your frontend to talk to the backend securely)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ==========================================
  // GET: Load all products for the website
  // ==========================================
  if (req.method === 'GET') {
    try {
      const products = await sql`SELECT * FROM products ORDER BY id DESC`;
      const settings = await sql`SELECT * FROM settings WHERE id = 1`;
      
      // Format database columns (snake_case) to match frontend (camelCase)
      const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        oldPrice: p.old_price ? Number(p.old_price) : null,
        image: p.image,
        description: p.description,
        sizes: p.sizes || [],
        featured: p.featured,
        inStock: p.in_stock,
        badge: p.badge
      }));

      const formattedSettings = {
        whatsappNumber: settings[0].whatsapp_number,
        phoneDisplay: settings[0].phone_display,
        address: settings[0].address,
        currency: settings[0].currency,
        currencySymbol: settings[0].currency_symbol
      };

      return res.status(200).json({ products: formattedProducts, settings: formattedSettings });
    } catch (error) {
      console.error("GET Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // POST: Save (Add or Edit) data from Admin
  // ==========================================
  if (req.method === 'POST') {
    try {
      const p = req.body;
      await sql`
        INSERT INTO products (id, name, category, price, old_price, image, description, sizes, featured, in_stock, badge)
        VALUES (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.oldPrice || null}, ${p.image}, ${p.description}, ${p.sizes}, ${p.featured}, ${p.inStock}, ${p.badge || null})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, 
          category = EXCLUDED.category, 
          price = EXCLUDED.price, 
          old_price = EXCLUDED.old_price, 
          image = EXCLUDED.image, 
          description = EXCLUDED.description,
          sizes = EXCLUDED.sizes, 
          featured = EXCLUDED.featured, 
          in_stock = EXCLUDED.in_stock, 
          badge = EXCLUDED.badge;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("POST Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ==========================================
  // DELETE: Remove a product from Admin
  // ==========================================
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "Product ID required" });

      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("DELETE Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // If method is not GET, POST, or DELETE
  return res.status(405).json({ error: 'Method not allowed' });
>>>>>>> c249896abefd84aaeb8c158e8fbef24b0326b4fd
}