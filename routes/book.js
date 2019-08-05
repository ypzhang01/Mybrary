const express = require('express')
const router = express.Router()
const Book = require('../models/book')
const Author = require('../models/author')
const imageMimeTypes = ['images/jpeg', 'image/png', 'image/gif']

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

router.post('/', async (req, res) => {
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        description: req.body.description
    })
    saveCover(book, req.body.cover)
    try {
        const newBook = await book.save()
        res.redirect(`/books/${newBook.id}`)
    } catch (error) {
        renderNewPage(res, book, true)
    }
})

router.get('/:id', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id).populate('author').exec()
        res.render('books/show', { book })
    } catch (error) {
        res.redirect('/books')
    }
})

router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id)
        renderEditPage(res, book)
    } catch (error) {
        res.redirect('/books')
    }
})

// router.put('/:id', upload.single('cover'), async (req, res) => {
//     let book
//     try {
//         book = await Book.findById(req.params.id)
//         book.title = req.body.title
//         book.author = req.body.authorId
//         book.publishDate = new Date(req.body.publishDate)
//         book.pageCount = req.body.pageCount
//         book.description = req.body.description
//         if (req.body.cover != null && req.body.cover.trim() != '') {
//             book.
//         }
//         res.redirect(`/books/${newBook.id}`)
//     } catch (error) {
//         if (book.coverImageName != null) {
//             removeBookCover(book.coverImageName)
//         }
//         renderNewPage(res, book, true)
//     }
// })

const renderNewPage = (res, book, hasError = false) => {
  renderFormPage(res, book, 'new', hasError)
}

const renderEditPage = (res, book, hasError = false) => {
    renderFormPage(res, book, 'edit', hasError)
  }

const renderFormPage = async (res, book, form, hasError = false) => {
    try {
        const authors = await Author.find({})
        const params = {
            authors,
            book
        }
        if (hasError) {
            params.errorMessage = 'Error'
        }
        res.render(`books/${form}`, params)
    } catch (error) {
        res.redirect('books')
    }
}

const saveCover = (book, coverEncoded) => {
    if (coverEncoded == null) {
        return
    } else {
        const cover = JSON.parse(coverEncoded)
        if (cover != null && imageMimeTypes.includes(cover.type)) {
            book.coverImage = new Buffer.from(cover.data, 'base64')
            book.coverImageType = cover.type
        }
    }
}

module.exports = router