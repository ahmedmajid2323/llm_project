import axios from 'axios'
import {load} from 'cheerio'

const targetUrl = 'https://www.scrapingcourse.com/ecommerce/';
let urlsToVisit = [targetUrl];
const maxCrawlLength = 20; // define the desired crawl limit

const crawler = async () => {
    for (; urlsToVisit.length > 0;) {
        // get the next URL from the list
        const currentUrl = urlsToVisit.shift();
        console.log(currentUrl)

        try {
            const response = await axios.get(currentUrl);
            const $ = load(response.data);

            // find all links on the page
            const linkElements = $('a[href]');
            linkElements.each((index, element) => {
                let url = $(element).attr('href');

                // check if the URL is a full link or a relative path
                if (!url.startsWith('http')) {
                    // remove leading slash if present
                    url = targetUrl + url.replace(/^\//, '');
                }

                // follow links within the target website
                if (url.startsWith(targetUrl) && !urlsToVisit.includes(url)) {
                    // update the URLs to visit
                    urlsToVisit.push(url);
                }
            });

        } catch (error) {
            console.error(`Error fetching ${targetUrl}: ${error.message}`);
        }
    }
    console.log(urlsToVisit);
};

await crawler()

