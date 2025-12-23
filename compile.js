const fs = require('node:fs');
const path = require('node:path');
const buffer = require('node:buffer');
const { Buffer } = buffer;
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const Mustache = require('mustache');
const minifyHtml = require("@minify-html/node")

console.log("Reading HTML");
const html = fs.readFileSync('./index.html', 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

console.log("Reading data");
const data = require('./data.json')
// load blocks
data.blocks.forEach(b => b[b.block + "Block"] = true)
// read and store file contents for html blocks
for (const block of data.blocks.filter(b => b.block == "html")) {
    block.content = fs.readFileSync(block.file, 'utf8')
};

console.log("Adding content");
let template = document.getElementById("template").innerHTML;
document.getElementById("target").innerHTML = Mustache.render(template, data);
document.title = data.profile.name;

console.log("Reading and inserting css");
const css = fs.readFileSync('./style.css', 'utf8');
const styleElem = document.createElement('style');
styleElem.innerHTML = Mustache.render(css, data.style);
document.getElementsByTagName('head')[0].appendChild(styleElem);

console.log("Removing scripts");
const scripts = document.querySelectorAll('script');
scripts.forEach(script => {
    if (script.src == 'helper.js' || script.src.includes('mustache') || script.id == "template")
        script.remove();
});

console.log("Adding custom script")
const curatorElem = document.createElement('script');
curatorElem.innerHTML = `
/* curator-feed-default-feed-layout */
(function aggregator(){
    var i,e,d=document,s="script";i=d.createElement("script");i.async=1;i.charset="UTF-8";
    i.src="https://cdn.curator.io/published/ff624290-dedd-4ddb-9c62-14c3f8d02556.js";
    e=d.getElementsByTagName(s)[0];e.parentNode.insertBefore(i, e);
})();
`;
document.getElementsByTagName('html')[0].appendChild(curatorElem);


let out_file = process.argv.length >= 3 ? process.argv[2] : "compiled.html"
const dir = path.dirname(out_file);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

var content = dom.serialize()
if (process.argv.length >= 4 && process.argv[3] === "minify")
    content = minifyHtml.minify(Buffer.from(content), {minify_css: true, minify_js: true})

fs.writeFileSync(out_file, content);
