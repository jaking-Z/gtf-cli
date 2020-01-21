const ggTranslate = require('google-translate-open-api')
const translate = ggTranslate.default

const textract = require('textract')
const officegen = require('officegen')
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const chalk = require('chalk')
const loading = require('./loading')
const getOutPath = pathStr => {
    const obj = path.parse(pathStr)
    obj.name = obj.name + '-translated'
    obj.base = ''
    obj.ext = '.docx'
    return path.format(obj)
}
async function selectFile(basePath) {
    const getPath = fileName => fileName ? path.resolve(basePath, fileName) : ''
    const ignoreFiles = ['.DS_Store']
    let filePaths = fs.readdirSync(basePath, {
        withFileTypes: true
    })
    filePaths = filePaths.filter(dirent => dirent.isFile() && !ignoreFiles.includes(dirent.name)).map(dirent => dirent.name)
    const len = filePaths.length
    if (len < 1) {
        console.log(chalk.red('没有可翻译文件，请到需要翻译文件目录下执行！'))
        return ''
    } else if (len === 1) {
        return getPath(filePaths[0])
    } else {
        const inqRes = await inquirer.prompt([{
            type: 'list',
            name: 'fileName',
            message: '请选择要翻译的文件：（上下键选择，回车键确认）',
            choices: filePaths
        }])
        return getPath(inqRes.fileName)
    }
}

function translateAndOutput(filePath) {
    loading.start('提取文本')
    textract.fromFileWithPath(filePath, {
        preserveLineBreaks: true
    }, function (error, text = '') {
        if (error) {
            loading.fail()
            console.log(error)
        }

        loading.done('翻译文本')
        translate(text.split(/\r|\n/g), {
            tld: "cn",
            to: "zh-CN",
        }).then(res => {
            const textArr = ggTranslate.parseMultiple(res.data[0])
            const outPath  = getOutPath(filePath)
            loading.done('生成已翻译文档')
            createWord(textArr, outPath, err => {
                if (err) {
                    return loading.fail()
                }
                loading.done()
                console.log(chalk.green('翻译文件输出路径为：' + outPath))
            })
        }).catch(e => console.log(e))
    })
}

function createWord(textArr = [], outPath, cb) {
    // Create an empty Word object:
    let docx = officegen('docx')

    // Officegen calling this function after finishing to generate the docx document:
    docx.on('finalize', function (written) {
        cb(null)
    })

    // Officegen calling this function to report errors:
    docx.on('error', function (err) {
        cb(err)
        console.log(err)
    })

    textArr.forEach(text => {
        // Create a new paragraph:
        let pObj = docx.createP()
        pObj.addText(text || '')
    })

    // Let's generate the Word document into a file:

    let out = fs.createWriteStream(outPath)

    out.on('error', function (err) {
        cb(err)
        console.log(err)
    })

    // Async call to generate the output file:
    docx.generate(out)
}

exports.selectFile = selectFile
exports.translate = translateAndOutput