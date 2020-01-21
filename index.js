#!/usr/bin/env node

const file = require('./js/file.js')
const cwd = process.cwd()

file.selectFile(cwd).then(filePath => {
  if (filePath) {
    file.translate(filePath)
  }
})