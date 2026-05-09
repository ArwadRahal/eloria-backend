require("dotenv").config();

const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const { Resend } = require("resend");
const cloudinary = require("cloudinary").v2;
const helmet = require("helmet");
const app = express();
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  })
);

app.use(express.json());

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
    frameguard: { action: "sameorigin" },
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })
);
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: "Too many requests. Please try again later."
  }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: "Too many login attempts. Please try again later."
  }
});

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  message: {
    error: "Too many orders. Please try again later."
  }
});

app.use(generalLimiter);

const verifyAdmin = (req, res, next) => {
  if (!process.env.ADMIN_SECRET_TOKEN) {
  return res.status(500).json({
    error: "Admin token is not configured"
  });
}
  const token = req.headers["x-admin-token"];

  if (!token) {
    return res.status(401).json({
      error: "Access denied. No admin token."
    });
  }

  if (token !== process.env.ADMIN_SECRET_TOKEN) {
    return res.status(403).json({
      error: "Invalid admin token."
    });
  }

  next();
};
const cleanText = (value) => {
  return sanitizeHtml(String(value || ""), {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();
};
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, and WEBP images are allowed"));
    }

    cb(null, true);
  }
});

const uploadToCloudinary = (fileBuffer, folder = "eloria-products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto"
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    stream.end(fileBuffer);
  });
};

const resend = new Resend(process.env.RESEND_API_KEY);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

app.post("/admin-login", adminLoginLimiter, (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required"
    });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      message: "Invalid password"
    });
  }

  return res.json({
    success: true,
    message: "Admin login successful",
    token: process.env.ADMIN_SECRET_TOKEN
  });
});

app.get("/", (req, res) => {
  res.send("ELORIA backend is running 💄");
});

/* =========================
   CATEGORIES
   ========================= */

app.get("/categories", (req, res) => {
  const sql = "SELECT * FROM categories ORDER BY id ASC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Error fetching categories:", err);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }

    return res.json(result);
  });
});

app.post("/categories", verifyAdmin, (req, res) => {
  const name = cleanText(req.body.name);

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const sql = "INSERT INTO categories (name) VALUES (?)";

  db.query(sql, [name.trim()], (err, result) => {
    if (err) {
      console.log("Error adding category:", err);
      return res.status(500).json({
        error: "Failed to add category",
       details: "Internal server error"
      });
    }

    return res.json({
      message: "Category added successfully",
      categoryId: result.insertId
    });
  });
});

app.delete("/categories/:id", verifyAdmin, (req, res) => {
const categoryId = Number(req.params.id);

if (!Number.isInteger(categoryId)) {
  return res.status(400).json({
    error: "Invalid category id"
  });
}
  const checkSql = "SELECT COUNT(*) AS count FROM products WHERE category_id = ?";

  db.query(checkSql, [categoryId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ error: "Error checking products" });
    }

    const count = result[0].count;

    if (count > 0) {
      return res.status(400).json({
        error: "Cannot delete category because it has products"
      });
    }

    const deleteSql = "DELETE FROM categories WHERE id = ?";

    db.query(deleteSql, [categoryId], (err2) => {
      if (err2) {
        console.log(err2);
        return res.status(500).json({ error: "Failed to delete category" });
      }

      return res.json({ message: "Category deleted" });
    });
  });
});

/* =========================
   PRODUCTS
   ========================= */

app.get("/products", (req, res) => {
  const sql = "SELECT * FROM products ORDER BY id DESC";

  db.query(sql, (err, result) => {
    if (err) {
      console.log("Error fetching products:", err);
      return res.status(500).json({ error: "Failed to fetch products" });
    }

    return res.json(result);
  });
});

app.post(
  "/products",
  verifyAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
const name = cleanText(req.body.name);
const price = Number(req.body.price);
const stock = Number(req.body.stock);
const category_id = Number(req.body.category_id);

      if (!name ||price <= 0 || stock < 0 || !Number.isFinite(price) ||
  !Number.isFinite(stock) ||
  !category_id
) {
        return res.status(400).json({
        error: "Invalid product data"
        });
      }

      let imageUrl = "";
      let imageUrl2 = "";
      let imageUrl3 = "";

      if (req.files?.image?.[0]) {
        imageUrl = await uploadToCloudinary(req.files.image[0].buffer);
      }

      if (req.files?.image2?.[0]) {
        imageUrl2 = await uploadToCloudinary(req.files.image2[0].buffer);
      }

      if (req.files?.image3?.[0]) {
        imageUrl3 = await uploadToCloudinary(req.files.image3[0].buffer);
      }

      const sql = `
        INSERT INTO products 
        (name, price, stock, category_id, image_url, image_url_2, image_url_3)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.query(
        sql,
        [name, price, stock, category_id, imageUrl, imageUrl2, imageUrl3],
        (err, result) => {
          if (err) {
            console.log("Error adding product:", err);
            return res.status(500).json({
              error: "Failed to add product",
             details: "Internal server error"
            });
          }

          return res.json({
            message: "Product added successfully",
            productId: result.insertId
          });
        }
      );
    } catch (error) {
      console.log("Cloudinary upload error:", error);
      return res.status(500).json({
        error: "Image upload failed",
        details: error.message
      });
    }
  }
);

app.put(
  "/products/:id",
  verifyAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 }
  ]),
  async (req, res) => {
    try {
const name = cleanText(req.body.name);
const price = Number(req.body.price);
const stock = Number(req.body.stock);
const category_id = Number(req.body.category_id);
const image_url = req.body.image_url;
const image_url_2 = req.body.image_url_2;
const image_url_3 = req.body.image_url_3;
const productId = Number(req.params.id);

if (!Number.isInteger(productId)) {
  return res.status(400).json({
    error: "Invalid product id"
  });
}
      let finalImageUrl = image_url || "";
      let finalImageUrl2 = image_url_2 || "";
      let finalImageUrl3 = image_url_3 || "";

      if (req.files?.image?.[0]) {
        finalImageUrl = await uploadToCloudinary(req.files.image[0].buffer);
      }

      if (req.files?.image2?.[0]) {
        finalImageUrl2 = await uploadToCloudinary(req.files.image2[0].buffer);
      }

      if (req.files?.image3?.[0]) {
        finalImageUrl3 = await uploadToCloudinary(req.files.image3[0].buffer);
      }
if (
  !name ||
  price <= 0 ||
  stock < 0 ||
  !Number.isFinite(price) ||
  !Number.isFinite(stock) ||
  !category_id
) {
  return res.status(400).json({
    error: "Invalid product data"
  });
}
      const sql = `
        UPDATE products
        SET name = ?, price = ?, stock = ?, category_id = ?, 
            image_url = ?, image_url_2 = ?, image_url_3 = ?
        WHERE id = ?
      `;

      db.query(
        sql,
        [
          name,
          price,
          stock,
          category_id,
          finalImageUrl,
          finalImageUrl2,
          finalImageUrl3,
          productId
        ],
        (err, result) => {
          if (err) {
            console.log("Error updating product:", err);
            return res.status(500).json({
              error: "Failed to update product",
             details: "Internal server error"
            });
          }

          return res.json({
            message: "Product updated successfully",
            affectedRows: result.affectedRows
          });
        }
      );
    } catch (error) {
      console.log("Cloudinary update error:", error);
      return res.status(500).json({
        error: "Image upload failed",
        details: error.message
      });
    }
  }
);

app.delete("/products/:id", verifyAdmin, (req, res) => {
const productId = Number(req.params.id);

if (!Number.isInteger(productId)) {
  return res.status(400).json({
    error: "Invalid product id"
  });
}
  db.query("DELETE FROM products WHERE id = ?", [productId], (err) => {
    if (err) {
      console.log("Error deleting product:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }

    return res.json({ message: "Product deleted successfully" });
  });
});

/* =========================
   ORDERS
   ========================= */

app.post("/orders", orderLimiter, (req, res) => {
  const { customerInfo, cart, totalPrice } = req.body;
if (!Number.isFinite(Number(totalPrice)) || Number(totalPrice) <= 0) {
  return res.status(400).json({
    error: "Invalid total price"
  });
}
  if (!customerInfo || !Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Invalid order data" });
  }

const fullName = cleanText(customerInfo.fullName);
const phone = cleanText(customerInfo.phone);
const city = cleanText(customerInfo.city);
const address = cleanText(customerInfo.address);
const notes = cleanText(customerInfo.notes);
const normalizedPhone = String(phone).replace(/\D/g, "");
const israeliPhoneRegex = /^05\d{8}$/;

if (!israeliPhoneRegex.test(normalizedPhone)) {
  return res.status(400).json({
    error: "Phone number must start with 05 and contain 10 digits"
  });
}
if (
  !fullName.trim() ||
  !city.trim() ||
  !address.trim()
) {
  return res.status(400).json({
    error: "Invalid customer information"
  });
}

for (const item of cart) {
  if (
    !item.id ||
   !cleanText(item.name)  ||
    Number(item.quantity) <= 0 ||
    Number(item.price) < 0
  ) {
    return res.status(400).json({
      error: "Invalid cart item"
    });
  }
}
  // if (!fullName || !phone || !city || !address) {
  //   return res.status(400).json({ error: "Missing customer information" });
  // }

  const productIds = cart.map((item) => item.id);

  db.query(
    "SELECT id, name, stock FROM products WHERE id IN (?)",
    [productIds],
    (stockCheckErr, stockRows) => {
      if (stockCheckErr) {
        console.log("Error checking stock:", stockCheckErr);
        return res.status(500).json({ error: "Failed to check stock" });
      }

      for (const item of cart) {
        const product = stockRows.find(
          (row) => Number(row.id) === Number(item.id)
        );

        if (!product) {
          return res.status(400).json({
            error: `Product not found: ${item.name}`
          });
        }

        if (Number(product.stock) < Number(item.quantity)) {
          return res.status(400).json({
            error: `Not enough stock for ${product.name}. Available: ${product.stock}`
          });
        }
      }

      const orderSql = `
        INSERT INTO orders 
        (customer_name, phone, city, address, notes, total_price, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?, 'cash_on_delivery', 'pending')
      `;

      db.query(
        orderSql,
        [fullName, phone, city, address, notes || "", totalPrice],
        (orderErr, orderResult) => {
          if (orderErr) {
            console.log("Error inserting order:", orderErr);
            return res.status(500).json({ error: "Failed to save order" });
          }

          const orderId = orderResult.insertId;

          const orderItemsValues = cart.map((item) => [
            orderId,
            item.id,
            cleanText(item.name),
            item.quantity,
            item.price
          ]);

          const orderItemsSql = `
            INSERT INTO order_items 
            (order_id, product_id, product_name, quantity, price)
            VALUES ?
          `;

          db.query(orderItemsSql, [orderItemsValues], (itemsErr) => {
            if (itemsErr) {
              console.log("Error inserting order items:", itemsErr);
              return res.status(500).json({
                error: "Failed to save order items"
              });
            }

            const updateStockPromises = cart.map((item) => {
              return new Promise((resolve, reject) => {
                const updateStockSql = `
                  UPDATE products
                  SET stock = stock - ?
                  WHERE id = ? AND stock >= ?
                `;

                db.query(
                  updateStockSql,
                  [item.quantity, item.id, item.quantity],
                  (updateErr, result) => {
                    if (updateErr) reject(updateErr);
                    else if (result.affectedRows === 0) {
                      reject(
                        new Error(`Not enough stock for product ID ${item.id}`)
                      );
                    } else {
                      resolve();
                    }
                  }
                );
              });
            });

            Promise.all(updateStockPromises)
              .then(() => {
                const itemsHtml = cart
                  .map(
                    (item) => `
                      <li>${item.name} — Qty: ${item.quantity} — Price: ${item.price} ₪</li>
                    `
                  )
                  .join("");

                const mailOptions = {
                  html: `
                    <h2>New Order Received</h2>
                    <p><strong>Order ID:</strong> ${orderId}</p>
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Phone:</strong> ${phone}</p>
                    <p><strong>City:</strong> ${city}</p>
                    <p><strong>Address:</strong> ${address}</p>
                    <p><strong>Notes:</strong> ${notes || "—"}</p>
                    <p><strong>Total:</strong> ${totalPrice} ₪</p>
                    <h3>Items:</h3>
                    <ul>${itemsHtml}</ul>
                  `
                };

                resend.emails
                  .send({
                    from: "ELORIA <onboarding@resend.dev>",
                    to: process.env.EMAIL_USER,
                    subject: `New ELORIA Order #${orderId} 💄`,
                    html: mailOptions.html
                  })
                  .catch((emailError) => {
                    console.log("Email failed, but order was saved:", emailError);
                  });

                return res.status(201).json({
                  message: "Order saved successfully",
                  orderId
                });
              })
              .catch((stockErr) => {
                console.log("Error updating stock:", stockErr);

                db.query("DELETE FROM order_items WHERE order_id = ?", [orderId], () => {
                  db.query("DELETE FROM orders WHERE id = ?", [orderId], () => {
                    return res.status(400).json({
                      error:
                        stockErr.message ||
                        "Not enough stock for one of the products."
                    });
                  });
                });
              });
          });
        }
      );
    }
  );
});

app.get("/orders", verifyAdmin, (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, result) => {
    if (err) {
      console.log("Error fetching orders:", err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    return res.json(result);
  });
});

app.get("/orders-with-items", verifyAdmin, (req, res) => {
  const ordersSql = "SELECT * FROM orders ORDER BY created_at DESC";

  db.query(ordersSql, (err, ordersResult) => {
    if (err) {
      console.log("Error fetching orders:", err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    if (ordersResult.length === 0) {
      return res.json([]);
    }

    const ordersWithItemsPromises = ordersResult.map((order) => {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id],
          (err, itemsResult) => {
            if (err) reject(err);
            else {
              resolve({
                ...order,
                items: itemsResult
              });
            }
          }
        );
      });
    });

    Promise.all(ordersWithItemsPromises)
      .then((ordersWithItems) => res.json(ordersWithItems))
      .catch((error) => {
        console.log("Error fetching order items:", error);
        return res.status(500).json({ error: "Failed to fetch order items" });
      });
  });
});

app.put("/orders/:id/status", verifyAdmin, (req, res) => {
  const { status } = req.body;
const orderId = Number(req.params.id);
const allowedStatuses = ["pending", "delivered", "cancelled"];

if (!allowedStatuses.includes(status)) {
  return res.status(400).json({
    error: "Invalid order status"
  });
}
if (!Number.isInteger(orderId)) {
  return res.status(400).json({
    error: "Invalid order id"
  });
}
  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (err, orderResult) => {
    if (err) {
      console.log("Error fetching order:", err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult[0];

    db.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId],
      (err) => {
        if (err) {
          console.log("Error updating order status:", err);
          return res.status(500).json({ error: "Failed to update order status" });
        }

        if (status === "cancelled" && !order.stock_restored) {
          db.query(
            "SELECT * FROM order_items WHERE order_id = ?",
            [orderId],
            (err, itemsResult) => {
              if (err) {
                console.log("Error fetching order items:", err);
                return res.status(500).json({ error: "Failed to fetch order items" });
              }

              const restorePromises = itemsResult.map((item) => {
                return new Promise((resolve, reject) => {
                  db.query(
                    "UPDATE products SET stock = stock + ? WHERE id = ?",
                    [item.quantity, item.product_id],
                    (err) => {
                      if (err) reject(err);
                      else resolve();
                    }
                  );
                });
              });

              Promise.all(restorePromises)
                .then(() => {
                  db.query(
                    "UPDATE orders SET stock_restored = TRUE WHERE id = ?",
                    [orderId],
                    (err) => {
                      if (err) {
                        console.log("Error marking stock restored:", err);
                        return res
                          .status(500)
                          .json({ error: "Failed to mark stock restored" });
                      }

                      return res.json({
                        message: "Order cancelled and stock restored successfully"
                      });
                    }
                  );
                })
                .catch((error) => {
                  console.log("Error restoring stock:", error);
                  return res.status(500).json({ error: "Failed to restore stock" });
                });
            }
          );
        } else {
          return res.json({ message: "Order status updated successfully" });
        }
      }
    );
  });
});

app.delete("/orders/:id", verifyAdmin, (req, res) => {
const orderId = Number(req.params.id);

if (!Number.isInteger(orderId)) {
  return res.status(400).json({
    error: "Invalid order id"
  });
}
  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (err, orderResult) => {
    if (err) {
      console.log("Error fetching order:", err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult[0];

    db.query(
      "SELECT * FROM order_items WHERE order_id = ?",
      [orderId],
      (err, itemsResult) => {
        if (err) {
          console.log("Error fetching order items:", err);
          return res.status(500).json({ error: "Failed to fetch order items" });
        }

        const shouldRestoreStock =
          order.status !== "cancelled" && !order.stock_restored;

        const restorePromises = shouldRestoreStock
          ? itemsResult.map((item) => {
              return new Promise((resolve, reject) => {
                db.query(
                  "UPDATE products SET stock = stock + ? WHERE id = ?",
                  [item.quantity, item.product_id],
                  (err) => {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            })
          : [];

        Promise.all(restorePromises)
          .then(() => {
            db.query("DELETE FROM order_items WHERE order_id = ?", [orderId], (err) => {
              if (err) {
                console.log("Error deleting order items:", err);
                return res.status(500).json({ error: "Failed to delete order items" });
              }

              db.query("DELETE FROM orders WHERE id = ?", [orderId], (err) => {
                if (err) {
                  console.log("Error deleting order:", err);
                  return res.status(500).json({ error: "Failed to delete order" });
                }

                return res.json({ message: "Order deleted successfully" });
              });
            });
          })
          .catch((error) => {
            console.log("Error restoring stock before delete:", error);
            return res.status(500).json({
              error: "Failed to restore stock before delete"
            });
          });
      }
    );
  });
});

db.connect((err) => {
  if (err) {
    console.log("❌ Error connecting to database:", err);
    return;
  }

  console.log("✅ Connected to MySQL database");

  const PORT = process.env.PORT || 8801;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});