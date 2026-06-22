// upload

app.post('/products/:id/images', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('image')           // รับไฟล์จาก multipart form

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No image provided' }, 400)
  }

  // สร้าง key ไม่ให้ชนกัน
  const ext = file.name.split('.').pop()
  const key = `products/${c.req.param('id')}/${crypto.randomUUID()}.${ext}`

  // อัปโหลดขึ้น R2
  await c.env.PRODUCT_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  // เก็บ URL ลง DB (ผ่าน public domain ที่ตั้งไว้ ดูข้อ 5)
  const imageUrl = `${c.env.R2_PUBLIC_URL}/${key}`

  await db.productImage.create({
    data: {
      productId: c.req.param('id'),
      imageUrl,
      isPrimary: false,
      sortOrder: 0,
    },
  })

  return c.json({ imageUrl }, 201)
})

// delete

app.delete('/products/images/:imageId', async (c) => {
  const image = await db.productImage.findUnique({
    where: { id: c.req.param('imageId') }
  })

  // ดึง key จาก URL เช่น "products/xxx/yyy.jpg"
  const key = image.imageUrl.replace(`${c.env.R2_PUBLIC_URL}/`, '')

  await c.env.PRODUCT_IMAGES.delete(key)
  await db.productImage.delete({ where: { id: c.req.param('imageId') } })

  return c.json({ success: true })
})

