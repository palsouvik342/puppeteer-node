const express = require('express')
const app = express()
import puppeteer from 'puppeteer';
const fs = require('fs');
const { parse } = require('csv');
const { stringify } = require('csv');

import * as path from 'path';
import { GoogleDriveService } from './googleDriveService';

const driveClientId = '417332661634-8aaditp746sl03bhaddq4bv2659cdf23.apps.googleusercontent.com';
const driveClientSecret = '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';
const driveRedirectUri = 'https://developers.google.com/oauthplayground';
const driveRefreshToken = '1//04Y4UvsnyNR14CgYIARAAGAQSNwF-L9Irvzt-0qTwUyvqzWBLm2iLYWWUM42soUpG4i12RCEQV-KkM9ts3vWBZlJksIqwF08M8U0';

const fetchTableData = async ()=>{
    console.log("Fetching All Data")
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://www.moneycontrol.com/stocks/marketinfo/dividends_declared/index.php');

    const tableData = await page.evaluate(() => {
        let tableRows = Array.from(document.querySelectorAll('table tr'));
        tableRows.splice(0,4);
        const rowDataArray: {[key: string]: string}[] = [];
        tableRows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            const rowData: {[key: string]: string} = {};
          
            cells.forEach((cell, index) => {
              rowData[`column${index}`] = cell.innerText;
            });
          
            rowDataArray.push(rowData);
          });
          
          return rowDataArray;    
        });
        console.log(tableData);
        generateCSv(tableData);
    
    await browser.close();
}
fetchTableData()


const generateCSv = (data: any)=> {
  const stringifier = stringify(data, { header: true });
  let csvString = '';
  stringifier.on('readable', () => {
    let row;
    while ((row = stringifier.read())) {
      csvString += row;
    }
  });

  stringifier.on('error', (err:any) => {
    console.error(err.message);
  });

  stringifier.on('end', () => {
    // Write the CSV string to a file
    fs.writeFile('data.csv', csvString, (err:any) => {
      if (err) throw err;
      console.log('CSV file has been saved.');
    });

    // Read the CSV file and parse it back into an array of objects
    fs.readFile('data.csv', (err:any, data:any) => {
      if (err) throw err;
      parse(data.toString(), { columns: true }, (err:any, output:any) => {
        if (err) throw err;
        console.log(output);
        uploadToDrive()
      });
    });
  });
}

const uploadToDrive = async () => {
  const googleDriveService = new GoogleDriveService(driveClientId, driveClientSecret, driveRedirectUri, driveRefreshToken);

  const finalPath = path.resolve(__dirname, './data.csv');
  const folderName = 'Puppeteer';

  if (!fs.existsSync(finalPath)) {
    throw new Error('File not found!');
  }

  let folder = await googleDriveService.searchFolder(folderName).catch((error:any) => {
    console.error(error);
    return null;
  });

  if (!folder) {
    folder = await googleDriveService.createFolder(folderName);
  }

  await googleDriveService.saveFile('generatedByPuppeteer', finalPath, 'application/csv', folder.id).catch((error:any) => {
    console.error(error);
  });

  console.info('File uploaded successfully!');

  // Delete the file on the server
  fs.unlinkSync(finalPath);
};


app.get('/', function (req:any, res:any) {
  res.send({"msg":"Hello World"})
})
app.listen(4000)


