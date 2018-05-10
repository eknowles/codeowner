#!/usr/bin/env node
npm
const fs = require('fs');
const glob = require('glob');
const async = require('async');
const columnify = require('columnify');

function getEmail(str) {
  const match = str.match(/<(.*)>/);
  return match && match.length > 1 ? match[1] : null;
}

function getPackages() {
  return new Promise((resolve, reject) => {
    const items = {};
    const p = `**/package.json`;
    glob(p, (er, files) => {
      files = files.filter((f) => !f.includes('node_modules'));
      async.each(files, (f, callback) => {
        fs.readFile(f, 'utf8', (err, data) => {
          if (err) throw err;
          const { author, contributors } = JSON.parse(data);
          if (!author && !contributors) {
            return callback();
          }
          const pathName = f.replace('/package.json', '/**/*');
          items[pathName] = [];
          if (author) {
            items[pathName].push(getEmail(author));
          }
          if (contributors) {
            contributors.forEach((contributor) => items[pathName].push(contributor.email));
          }
          items[pathName] = items[pathName].sort().join(' ');
          return callback();
        });
      }, err => {
        if (err) reject();
        return resolve(items);
      });
    });
  });
}

getPackages()
  .then((data) => {
    const output = columnify(data, {
      columns: ['# File Name', 'GitHub Email']
    });
    fs.writeFile('./CODEOWNERS', output, err => { // close file
      if (err) throw err;
    });
  });
