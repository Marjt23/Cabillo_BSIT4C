const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const database=require('./database');
const root=__dirname;
const DEFAULT_PORT=4173;
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};

function startServer(port=DEFAULT_PORT){
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/api/sales'&&req.method==='POST'){
      res.setHeader('Content-Type','application/json');
      let body='';
      try{
        for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384){res.writeHead(413);return res.end(JSON.stringify({error:'Order too large.'}));}}
        const input=JSON.parse(body);
        const receipt=await database.saveSale(input);
        res.writeHead(201);return res.end(JSON.stringify(receipt));
      }catch(error){
        const invalid=error instanceof SyntaxError||/^(Invalid|Insufficient)/.test(error.message);
        res.writeHead(invalid?400:503);return res.end(JSON.stringify({error:invalid?error.message:'Could not save your sale. Please retry.'}));
      }
    }
    let pathname;
    try {pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end('Bad request');}
    const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+path.sep)||!['index.html','styles.css','pos.js','app.js'].includes(path.relative(root,file))){res.writeHead(404);return res.end('Not found');}
    fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});res.end(data);});
  });

  server.on('error',(error)=>{
    if(error.code==='EADDRINUSE'){
      console.warn(`Port ${port} is in use. Trying ${port+1} instead.`);
      startServer(port+1);
      return;
    }
    throw error;
  });

  server.listen(port,'127.0.0.1',()=>console.log(`Bite & Brew: http://127.0.0.1:${port}`));
  return server;
}

if(require.main===module){database.initialize().then(()=>startServer(Number(process.env.PORT)||DEFAULT_PORT)).catch(()=>{console.error('Database setup failed. Check DATABASE_URL and database access.');process.exitCode=1;});}

module.exports={DEFAULT_PORT,startServer};
