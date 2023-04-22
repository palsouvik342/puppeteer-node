import puppeteer from 'puppeteer';
const fetchTable = async ()=>{
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php');
    const data = await page.evaluate(() => {
    const tds = Array.from(document.querySelectorAll('table tr td'))
    return tds.map(td => td)
    });
    console.log(data)
}

module.exports={fetchTable}