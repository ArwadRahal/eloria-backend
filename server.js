require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const fs = require("fs");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000"
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true
});

const queryAsync = (sql, values = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

async function importSqlIfNeeded() {
  try {
    const tables = await queryAsync("SHOW TABLES LIKE 'products'");

    if (tables.length > 0) {
      console.log("✅ Database tables already exist, skipping SQL import");
      return;
    }

    const sqlFilePath = path.join(__dirname, "eloria.sql");

    if (!fs.existsSync(sqlFilePath)) {
      console.log("⚠️ eloria.sql file not found, skipping import");
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

    if (!sqlContent.trim()) {
      console.log("⚠️ eloria.sql is empty, skipping import");
      return;
    }

    await queryAsync(sqlContent);
    console.log("✅ SQL file imported successfully");
  } catch (error) {
    console.log("❌ Error importing SQL file:", error);
  }
}

app.get("/", (req, res) => {
  res.send("ELORIA backend is running 💄");
});

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
app.put("/products/:id", (req, res) => {
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 }
  ])(req, res, (uploadErr) => {
    if (uploadErr) {
      console.log("❌ Upload error:", uploadErr);
      return res.status(500).json({
        error: "Upload failed",
        details: uploadErr.message
      });
    }

    const productId = req.params.id;

    const {
      name,
      price,
      stock,
      category_id,
      image_url,
      image_url_2,
      image_url_3
    } = req.body;

    const finalImageUrl = req.files?.image?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image[0].filename}`
      : image_url || "";

    const finalImageUrl2 = req.files?.image2?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image2[0].filename}`
      : image_url_2 || "";

    const finalImageUrl3 = req.files?.image3?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image3[0].filename}`
      : image_url_3 || "";

    const sql = `
      UPDATE products
      SET name = ?, price = ?, stock = ?, category_id = ?, image_url = ?, image_url_2 = ?, image_url_3 = ?
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
          console.log("❌ Error updating product:", err);
          return res.status(500).json({
            error: "Failed to update product",
            details: err.message
          });
        }

        res.json({
          message: "Product updated successfully",
          affectedRows: result.affectedRows
        });
      }
    );
  });
});
app.put(  "/products/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 }
  ]),
  (req, res) => {
    const productId = req.params.id;

    const {
      name,
      price,
      stock,
      category_id,
      image_url,
      image_url_2,
      image_url_3
    } = req.body;

    const finalImageUrl = req.files?.image?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image[0].filename}`
      : image_url || "";

    const finalImageUrl2 = req.files?.image2?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image2[0].filename}`
      : image_url_2 || "";

    const finalImageUrl3 = req.files?.image3?.[0]
      ? `${req.protocol}://${req.get("host")}/uploads/${req.files.image3[0].filename}`
      : image_url_3 || "";

    const sql = `
      UPDATE products
      SET name = ?, price = ?, stock = ?, category_id = ?, image_url = ?, image_url_2 = ?, image_url_3 = ?
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
          console.log("❌ Error updating product:", err);
          return res.status(500).json({
            error: "Failed to update product",
            details: err.message
          });
        }

        return res.json({
          message: "Product updated successfully",
          affectedRows: result.affectedRows
        });
      }
    );
  }
);
app.delete("/products/:id", (req, res) => {
  const productId = req.params.id;

  db.query("DELETE FROM products WHERE id = ?", [productId], (err) => {
    if (err) {
      console.log("Error deleting product:", err);
      return res.status(500).json({ error: "Failed to delete product" });
    }

    return res.json({ message: "Product deleted successfully" });
  });
});

app.post("/orders", (req, res) => {
  const { customerInfo, cart, totalPrice } = req.body;
  const { fullName, phone, city, address, notes } = customerInfo;

  const orderSql = `
    INSERT INTO orders (customer_name, phone, city, address, notes, total_price, payment_method, status)
    VALUES (?, ?, ?, ?, ?, ?, 'cash_on_delivery', 'pending')
  `;

  db.query(
    orderSql,
    [fullName, phone, city, address, notes, totalPrice],
    (err, orderResult) => {
      if (err) {
        console.log("Error inserting order:", err);
        return res.status(500).json({ error: "Failed to save order" });
      }

      const orderId = orderResult.insertId;

      const orderItemsValues = cart.map((item) => [
        orderId,
        item.id,
        item.name,
        item.quantity,
        item.price
      ]);

      const orderItemsSql = `
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price)
        VALUES ?
      `;

      db.query(orderItemsSql, [orderItemsValues], (err) => {
        if (err) {
          console.log("Error inserting order items:", err);
          return res.status(500).json({ error: "Failed to save order items" });
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
              (err, result) => {
                if (err) {
                  reject(err);
                } else if (result.affectedRows === 0) {
                  reject(new Error(`Not enough stock for product ID ${item.id}`));
                } else {
                  resolve();
                }
              }
            );
          });
        });

        Promise.all(updateStockPromises)
          .then(async () => {
            const itemsHtml = cart
              .map(
                (item) => `
                  <li>${item.name} — Qty: ${item.quantity} — Price: ${item.price} ₪</li>
                `
              )
              .join("");

            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: process.env.EMAIL_USER,
              subject: `New ELORIA Order #${orderId} 💄`,
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

            try {
              await transporter.sendMail(mailOptions);
              return res.json({
                message: "Order saved, stock updated, and email sent successfully",
                orderId
              });
            } catch (emailError) {
              console.log("Error sending email:", emailError);
              return res.json({
                message: "Order saved and stock updated, but email failed",
                orderId
              });
            }
          })
          .catch((error) => {
            console.log("Error updating stock:", error);
            return res.status(500).json({ error: "Stock update failed" });
          });
      });
    }
  );
});

app.get("/orders", (req, res) => {
  db.query("SELECT * FROM orders ORDER BY created_at DESC", (err, result) => {
    if (err) {
      console.log("Error fetching orders:", err);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    return res.json(result);
  });
});

app.get("/orders-with-items", (req, res) => {
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
            if (err) {
              reject(err);
            } else {
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
        res.status(500).json({ error: "Failed to fetch order items" });
      });
  });
});

app.put("/orders/:id/status", (req, res) => {
  const orderId = req.params.id;
  const { status } = req.body;

  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (err, orderResult) => {
    if (err) {
      console.log("Error fetching order:", err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult[0];

    db.query("UPDATE orders SET status = ? WHERE id = ?", [status, orderId], (err) => {
      if (err) {
        console.log("Error updating order status:", err);
        return res.status(500).json({ error: "Failed to update order status" });
      }

      if (status === "cancelled" && !order.stock_restored) {
        db.query("SELECT * FROM order_items WHERE order_id = ?", [orderId], (err, itemsResult) => {
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
                    return res.status(500).json({ error: "Failed to mark stock restored" });
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
        });
      } else {
        return res.json({ message: "Order status updated successfully" });
      }
    });
  });
});

app.delete("/orders/:id", (req, res) => {
  const orderId = req.params.id;

  db.query("SELECT * FROM orders WHERE id = ?", [orderId], (err, orderResult) => {
    if (err) {
      console.log("Error fetching order:", err);
      return res.status(500).json({ error: "Failed to fetch order" });
    }

    if (orderResult.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderResult[0];

    db.query("SELECT * FROM order_items WHERE order_id = ?", [orderId], (err, itemsResult) => {
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
          return res.status(500).json({ error: "Failed to restore stock before delete" });
        });
    });
  });
});

async function startServer() {
  db.connect(async (err) => {
    if (err) {
      console.log("❌ Error connecting to database:", err);
      return;
    }

    console.log("✅ Connected to MySQL database");

    await importSqlIfNeeded();

    const PORT = process.env.PORT || 8801;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  });
}

startServer();