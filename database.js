require('dotenv').config({quiet:true});
const {Pool}=require('pg');
const {products}=require('./pos');
const connectionString=process.env.DATABASE_URL?.replace('sslmode=require','sslmode=verify-full');
const pool=new Pool({connectionString, enableChannelBinding:true, connectionTimeoutMillis:10000, query_timeout:10000});
pool.on('error',()=>console.error('Database connection interrupted.'));
async function initialize(){
  if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL in .env before starting.');
  await pool.query(`CREATE TABLE IF NOT EXISTS bite_brew_sales (
    reference TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    receipt JSONB NOT NULL
  )`);
}
async function saveSale(input){
  if(!input||!/^BB-[A-Z0-9-]{10,100}$/.test(input.reference)||!Array.isArray(input.items)||!input.items.length||input.items.length>products.length)throw new Error('Invalid order.');
  const seen=new Set();
  const items=input.items.map(item=>{
    const product=products.find(p=>p.id===item.id);
    if(!product||seen.has(item.id)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10000)throw new Error('Invalid quantity or product.');
    seen.add(item.id);
    return {...product,quantity:item.quantity,subtotal:product.price*item.quantity};
  });
  const total=items.reduce((sum,item)=>sum+item.subtotal,0);
  if(!['Cash','QR Payment','Credit/Debit Card'].includes(input.method))throw new Error('Invalid payment method.');
  const paid=input.method==='Cash'?input.paid:total;
  if(!Number.isSafeInteger(paid)||paid<total)throw new Error('Insufficient or invalid payment.');
  const receipt={reference:input.reference,date:new Date().toISOString(),items,total,paid,change:paid-total,method:input.method,status:'Payment Successful'};
  const result=await pool.query('INSERT INTO bite_brew_sales (reference,receipt) VALUES ($1,$2) ON CONFLICT (reference) DO UPDATE SET reference=EXCLUDED.reference RETURNING receipt',[receipt.reference,receipt]);
  return result.rows[0].receipt;
}
module.exports={initialize,saveSale,pool};
