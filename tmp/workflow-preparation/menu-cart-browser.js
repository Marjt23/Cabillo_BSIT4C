'use strict';
// Independent menu/cart verification. No database connection or payment writes.
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const assets=new Set(['index.html','styles.css','pos.js','app.js']);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript'};

async function verify(){
  const server=http.createServer(async(req,res)=>{
    const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
    if(!assets.has(name)){res.writeHead(404);return res.end();}
    try{res.setHeader('Content-Type',types[path.extname(name)]+'; charset=utf-8');res.end(await fs.readFile(path.join(root,name)));}
    catch{res.writeHead(500);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    // External imagery/fonts are irrelevant to financial/menu state checks.
    await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
    const url=`http://127.0.0.1:${server.address().port}`;
    const action=(name,id)=>page.locator(`[data-action="${name}"]${id?`[data-id="${id}"]`:''}`);
    const total=()=>page.locator('.cart .total strong').textContent();
    const filter=category=>page.locator(`[data-action="filter"][data-category="${category}"]`);
    const cartNames=()=>page.locator('.cart .item-head div>strong').allTextContents();
    await page.goto(url);
    assert.equal(await action('review').isDisabled(),true,'empty checkout is disabled');
    const categories={All:['Coffee','Sandwich','Soft Drink','Cookies','Bottled Water','Chocolate'],Drinks:['Coffee','Soft Drink','Bottled Water'],Food:['Sandwich'],Snacks:['Cookies','Chocolate']};
    for(const [category,names] of Object.entries(categories)){
      await filter(category).click();
      assert.deepEqual(await page.locator('.product h3').allTextContents(),names,category+' product membership');
      assert.equal(await filter(category).getAttribute('aria-pressed'),'true');
      assert.equal(await page.locator('.filters [aria-pressed="true"]').count(),1);
    }
    await filter('All').click();
    await action('add','coffee').click();
    await action('add','coffee').click();
    await action('add','sandwich').click();
    await action('add','soft-drink').click();
    assert.equal(await total(),'₱175.00');
    await filter('Snacks').click();
    assert.deepEqual(await cartNames(),['Coffee','Sandwich','Soft Drink'],'filter does not lose hidden cart items');
    assert.equal(await total(),'₱175.00');
    await action('plus','coffee').click();assert.equal(await total(),'₱220.00');
    await action('minus','coffee').click();assert.equal(await total(),'₱175.00');
    await action('remove','soft-drink').click();assert.equal(await total(),'₱140.00');
    await action('review').click();
    assert.deepEqual(await page.locator('.review tbody tr').allTextContents(),['Coffee2₱45.00₱90.00','Sandwich1₱50.00₱50.00']);
    await action('back-order').click();
    assert.equal(await total(),'₱140.00');
    assert.deepEqual(await cartNames(),['Coffee','Sandwich']);
    assert.equal(await filter('Snacks').getAttribute('aria-pressed'),'true','Back retains category');
    await action('minus','coffee').click();assert.equal(await total(),'₱95.00');
    await action('minus','coffee').click();assert.equal(await total(),'₱50.00');
    assert.equal(await action('minus','coffee').count(),0,'quantity zero removes item');
    await action('remove','sandwich').click();
    assert.equal(await total(),'₱0.00');assert.equal(await action('review').isDisabled(),true);
    await filter('Food').focus();await page.keyboard.press('Enter');
    assert.deepEqual(await page.locator('.product h3').allTextContents(),['Sandwich'],'keyboard filter activation');
    for(const width of [320,390,660,900,1440]){
      await page.setViewportSize({width,height:900});
      await page.goto(url);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'page fits '+width);
      await action('add','coffee').click();
      for(const locator of [action('add','coffee'),action('plus','coffee'),action('minus','coffee'),action('remove','coffee'),action('review')]){
        const box=await locator.boundingBox();
        assert.ok(box&&box.width>=44&&box.height>=44,'touch target at least 44px at '+width);
      }
      if(width<=660){
        const shortcut=page.locator('.mobile-cart');assert.equal(await shortcut.isVisible(),true);
        await shortcut.click();
        assert.equal(new URL(page.url()).hash,'#cart');
      }
      await action('review').click();await action('back-order').click();
      assert.equal(await total(),'₱45.00');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'populated cart fits '+width);
    }
    assert.deepEqual(errors,[],'no browser JavaScript errors');
    console.log('PASS: category membership/selection, filter cart retention, quantities, removal, totals, empty checkout, Back, keyboard activation, five viewport widths and 44px touch targets.');
  }finally{
    if(browser)await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
