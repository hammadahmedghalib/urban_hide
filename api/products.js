import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: Load products
  if (req.method === 'GET') {
    try {
      const products = await sql`SELECT * FROM products ORDER BY id DESC`;
      const settings = await sql`SELECT * FROM settings WHERE id = 1`;
      
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
      return res.status(500).json({ error: error.message });
    }
  }

  // POST: Add or Edit product
  if (req.method === 'POST') {
    try {
      const p = req.body;
      await sql`
        INSERT INTO products (id, name, category, price, old_price, image, description, sizes, featured, in_stock, badge)
        VALUES (${p.id}, ${p.name}, ${p.category}, ${p.price}, ${p.oldPrice || null}, ${p.image}, ${p.description}, ${p.sizes}, ${p.featured}, ${p.inStock}, ${p.badge || null})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, category = EXCLUDED.category, price = EXCLUDED.price, 
          old_price = EXCLUDED.old_price, image = EXCLUDED.image, description = EXCLUDED.description,
          sizes = EXCLUDED.sizes, featured = EXCLUDED.featured, in_stock = EXCLUDED.in_stock, badge = EXCLUDED.badge;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

    // PUT: Update Store Settings
  if (req.method === 'PUT') {
    try {
      const s = req.body;
      await sql`
        UPDATE settings 
        SET whatsapp_number = ${s.whatsappNumber}, 
            phone_display = ${s.phoneDisplay}, 
            address = ${s.address}, 
            currency = ${s.currency}, 
            currency_symbol = ${s.currencySymbol}
        WHERE id = 1;
      `;
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("PUT Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE: Remove product
  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: "ID required" });
      await sql`DELETE FROM products WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}