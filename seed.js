'use strict';
const {pool}=require('./database');
const {products}=require('./pos');

async function seedProducts(){
  if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in .env before seeding.');
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    await client.query(`CREATE TABLE IF NOT EXISTS bite_brew_products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price_centavos INTEGER NOT NULL CHECK (price_centavos >= 0),
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      photo TEXT NOT NULL
    )`);
    for(const product of products){
      await client.query(`INSERT INTO bite_brew_products
        (id,name,price_centavos,category,icon,description,photo)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        ON CONFLICT (id) DO UPDATE SET
          name=EXCLUDED.name, price_centavos=EXCLUDED.price_centavos,
          category=EXCLUDED.category, icon=EXCLUDED.icon,
          description=EXCLUDED.description, photo=EXCLUDED.photo`,
        [product.id,product.name,product.price,product.category,product.icon,product.description,product.photo]);
    }
    const result=await client.query('SELECT id,name,price_centavos,category,icon,description,photo FROM bite_brew_products WHERE id=ANY($1::text[])',[products.map(p=>p.id)]);
    for(const product of products){
      const row=result.rows.find(r=>r.id===product.id);
      if(!row||row.name!==product.name||row.price_centavos!==product.price||row.category!==product.category||row.icon!==product.icon||row.description!==product.description||row.photo!==product.photo)throw new Error('Seed verification failed.');
    }
    await client.query('COMMIT');
    console.log(`Seeded and verified ${products.length} products in bite_brew_products.`);
  }catch(error){
    await client.query('ROLLBACK');
    throw error;
  }finally{client.release();}
}

if(require.main===module){
  seedProducts().catch(error=>{
    console.error('Product seed failed:',error.code||'Check database configuration and table schema.');
    process.exitCode=1;
  }).finally(()=>pool.end());
}
module.exports={seedProducts};
