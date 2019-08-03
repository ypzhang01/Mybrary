const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Book = require('../models/book')
const uploadPath = path.join('public', Book.coverImageBasePath)
const Author = require('../models/author')
const imageMimeTypes = ['images/jpeg', 'image/png', 'image/gif']
const upload = multer({
    dest: uploadPath,
    fileFilter: (req, file, callback) => {
        callback(null, imageMimeTypes.includes(file.mimetype))
    }
})

router.get('/', async (req, res) => {
    let query = Book.find()
    if (req.query.title && req.query.title.trim()) {
        query = query.regex('title', new RegExp(req.query.title, 'i'))
    }
    if (req.query.publishedBefore && req.query.publishedBefore.trim()) {
        query = query.lte('publishDate', req.query.publishedBefore)
    }
    if (req.query.publishedAfter && req.query.publishedAfter.trim()) {
        query = query.gte('publishDate', req.query.publishedAfter)
    }
    try {
        const books = await query.exec()
        res.render('books/index', {
            books,
            searchOptions: req.query
        })
    } catch (error) {
        res.redirect('/')
    }
})

router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
})

router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description,
        coverImageName: fileName
    })
    try {
        const newBook = await book.save()
        res.redirect('books')
    } catch (error) {
        if (book.coverImageName != null) {
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
})

const removeBookCover = (fileName) => {
    fs.unlink(path.join(uploadPath, fileName), err => {
        if (err) {
            console.log(err)
        }
    })
}

const renderNewPage = async (res, book, hasError = false) => {
    try {
        const authors = await Author.find({})
        const params = {
            authors,
            book
        }
        if (hasError) {
            params.errorMessage = 'Error creating book'
        }
        res.render('books/new', params)
    } catch (error) {
        res.redirect('books')
    }
}

module.exports = router