const express = require('express');
const router = express.Router();
const isBase64 = require('is-base64');  // library untuk mengecek sebuah file base64 
const base64Img = require('base64-img'); // library untuk upload image dengan tipe base64
const fs = require('fs'); // filesystem (just search on google.)

const { Media } = require('../models');




// API GET (Ambil list semua gambar)
router.get('/', async(req, res) => {
  const media = await Media.findAll({
    attributes: ['id', 'image'] // yang ditampilkan hanya id dan url image saja.
  });

  // Mengubah URL image menjadi URL yang langsung bisa dipakai.
  const mappedMedia = media.map((m) => {
    m.image = `${req.get('host')}/${m.image}`;
    return m;
  }); 

  return res.json({
    status: 'success. Displaying requested data.', 
    data: mappedMedia, 
  })
});




// API POST (Upload Image)
router.post('/', (req, res) => {
  const image = req.body.image;

  // MENGECEK APAKAH IMAGE SUDAH BASE64 ATAU BELUM
  // tipe image di cek menggunakan library 'is-base64' dan 'base64-img'
  // Jika tipe image bukan base64, maka akan muncul error 400.
  if (!isBase64(image, { mimeRequired: true })) {
    return res.status(400).json({ status: 'error', message: 'invalid base64' })
  };

  // UPLOAD IMAGE
  // path image disimpan di './public/images'
  // jika error atau terjadi kesalahan, muncul error 400.
  // jika tidak error, maka filename image akan disimpan ke dalam database.
  base64Img.img(image, './public/images', Date.now(), async (err, filepath) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message })
    }

    // filepath : lokasi dari image yang telah di upload.
    const filename = filepath.split("\\").pop().split("/").pop();

    const media = await Media.create({ image: `images/${filename}` });

    // jika berhasil, tampilkan status dibawah berikut.
    return res.json({
      status: 'success',
      data: {
        id: media.id, // ID Image yang di upload
        image: `${req.get('host')}/images/${filename}` // URL image yang nanti bisa diakses di front-end
      }
    });
  }); 
});




// API DELETE (Hapus Image)
router.delete('/:id', async (req, res) => {
  const id = req.params.id;

  // Mengecek apakah ID ada/tidak ada dalam database.
  const media = await Media.findByPk(id);

  if (!media) {
    return res.status(404).json({ status: 'error', message: 'media not found.' });
  }

  fs.unlink(`./public/${media.image}`, async (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message })
    }

    // Jika ID ketemu, hapus.
    await media.destroy();

    return res.json({
      status: 'success', 
      message: 'image deleted succesfully.'
    });
  });
});

module.exports = router;
