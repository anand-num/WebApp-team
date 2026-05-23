const express = require("express");
const router = express.Router();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

// ========== AUTH ROUTES (no userId parameter) ==========
router.get("/", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const collection = db.collection("users");
    const result = await collection
      .find({}, { projection: { password: 0 } })
      .toArray();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    await client.connect();
    const db = client.db("webapp-team");
    const collection = db.collection("users");

    const user = await collection.findOne({
      $or: [{ email: email }, { username: email }],
      password: password,
    });

    if (!user) {
      return res.status(401).json({ error: "Имэйл эсвэл нууц үг буруу байна" });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;
    await client.connect();
    const db = client.db("webapp-team");
    const collection = db.collection("users");

    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (existing) {
      return res
        .status(400)
        .json({ error: "Энэ имэйл аль хэдийн бүртгэлтэй байна" });
    }

    const newUser = { email, username, password, createdAt: new Date() };
    await collection.insertOne(newUser);

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    await client.connect();
    const db = client.db("webapp-team");
    const collection = db.collection("users");
    const existing = await collection.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
    });
    res.json({ exists: !!existing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CART ROUTES (SPECIFIC - MUST COME BEFORE /:userId) ==========
router.post("/:userId/cart/add", async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id, starts_at, expires_at, status = "pending" } = req.body;

    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItem = {
      cart_id: new ObjectId().toString(),
      product_id: product_id,
      starts_at: starts_at,
      expires_at: expires_at,
      status: status,
      added_at: new Date().toISOString(),
    };

    await usersCollection.updateOne(
      { user_id: userId },
      { $push: { cart: cartItem } },
    );

    const updatedUser = await usersCollection.findOne(
      { user_id: userId },
      { projection: { cart: 1 } },
    );

    res.status(201).json({
      success: true,
      message: "Item added to cart",
      cart: updatedUser.cart || [],
      cartCount: (updatedUser.cart || []).length,
    });
  } catch (error) {
    console.error("Cart add error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:userId/cart", async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { cart: 1, username: 1 } },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user_id: userId,
      username: user.username,
      cart: user.cart || [],
      cartCount: (user.cart || []).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:userId/cart/remove/:cartId", async (req, res) => {
  try {
    const { userId, cartId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    await usersCollection.updateOne(
      { user_id: userId },
      { $pull: { cart: { cart_id: cartId } } },
    );

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:userId/cart/checkout", async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("product");

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const rentalItems = user.cart.map((item) => ({
      rental_id: new ObjectId().toString(),
      product_id: item.product_id,
      starts_at: item.starts_at,
      expires_at: item.expires_at,
      status: 'paid',
      rented_at: new Date().toISOString(),
    }));

    await usersCollection.updateOne(
      { user_id: userId },
      {
        $push: { rented_items: { $each: rentalItems } },
        $set: { cart: [] },
      },
    );

    const productIds = user.cart
      .map((item) => item.product_id)
      .filter((id) => id != null);
    await productsCollection.updateMany(
      { id: { $in: productIds } },
      { $set: { status: "pending" } },
    );

    res.json({
      message: `Successfully checked out ${rentalItems.length} items`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== RENTED ITEMS ROUTES ==========
router.get("/:userId/rented-items", async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { rented_items: 1, username: 1 } },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user_id: userId,
      username: user.username,
      rented_items: user.rented_items || [],
      total_rented: (user.rented_items || []).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:userId/rented-items/:rentalId/return", async (req, res) => {
  try {
    const { userId, rentalId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("product");

    const user = await usersCollection.findOne(
      { user_id: userId, "rented_items.rental_id": rentalId },
      { projection: { "rented_items.$": 1 } },
    );

    const rental = user?.rented_items?.[0];

    if (rental && rental.product_id != null) {
      await productsCollection.updateOne(
        { id: rental.product_id },
        { $set: { status: "done" } },
      );
    }

    await usersCollection.updateOne(
      {
        user_id: userId,
        "rented_items.rental_id": rentalId,
      },
      {
        $set: {
          "rented_items.$.returned_at": new Date().toISOString(),
        },
      },
    );

    res.json({ message: "Item returned successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== PUBLISH REQUEST ROUTES ==========
// POST /api/users/:userId/publish-request — шинэ зар нэмэх (зурагтай)
router.post("/:userId/publish-request", async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, brand, price, size, description, category, img } = req.body;

    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create publish request
    const requestId = new ObjectId().toString();
    const publishRequest = {
      request_id: requestId,
      name: name,
      brand: brand,
      price: price,
      size: size || "S/M/L",
      description: description || "",
      category: category || "Other",
      img: img || "", // Image filename or URL
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await usersCollection.updateOne(
      { user_id: userId },
      { $push: { publish_requests: publishRequest } },
    );

    res.status(201).json({
      success: true,
      message: "Зар илгээгдлээ! Admin баталгаажуулна.",
      request: publishRequest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/publish-requests — publish requests жагсаалт
router.get("/:userId/publish-requests", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const user = await db
      .collection("users")
      .findOne(
        { user_id: req.params.userId },
        { projection: { publish_requests: 1 } },
      );
    res.json(user?.publish_requests || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/publish-request/:requestId/approve — admin баталгаажуулах
router.put("/:userId/publish-request/:requestId/approve", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("product");

    const { userId, requestId } = req.params;

    console.log("Approve called:", { userId, requestId });

    // Find the user with this publish request
    const user = await usersCollection.findOne({ user_id: userId });

    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user.username);
    console.log("Publish requests:", user.publish_requests);

    // Find the specific request
    const request = user.publish_requests?.find(
      (r) => r.request_id === requestId,
    );

    if (!request) {
      console.log("Request not found:", requestId);
      return res.status(404).json({ error: "Publish request not found" });
    }

    console.log("Request found:", request.name);

    // Get new product ID
    const lastProduct = await productsCollection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const newProductId = lastProduct.length ? lastProduct[0].id + 1 : 1;

    console.log("New product ID:", newProductId);

    // Create new product with FULL details from request
    const newProduct = {
      id: newProductId,
      brand: request.brand || "",
      publisher: user.username || userId,
      item_name: request.name || "",
      rating: 0,
      review_count: 0,
      price: request.price || "",
      price_period: "өдрөөс",
      status: "Standard",
      category: request.category || "Other",
      description: request.description || "",
      img_src: request.img || "",
      sizes: request.size ? request.size.split("/") : ["S", "M", "L"],
      in_stock: 1,
      date_posted: new Date().toISOString().split("T")[0],
    };

    const productResult = await productsCollection.insertOne(newProduct);
    console.log("Product inserted:", productResult.insertedId);

    // Remove from publish_requests array using $pull
    const pullResult = await usersCollection.updateOne(
      { user_id: userId },
      { $pull: { publish_requests: { request_id: requestId } } },
    );
    console.log("Pull result:", pullResult);

    // Add to published_items
    const pushResult = await usersCollection.updateOne(
      { user_id: userId },
      {
        $push: {
          published_items: {
            product_id: newProductId,
            status: "published",
            views: 0,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );
    console.log("Push result:", pushResult);

    res.json({
      success: true,
      message: "Зар баталгаажлаа! Product collection-д нэмэгдлээ.",
      product: newProduct,
    });
  } catch (error) {
    console.error("Approve error:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/publish-request/:requestId/reject — admin буцаах
router.put("/:userId/publish-request/:requestId/reject", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const { userId, requestId } = req.params;

    console.log("Reject called:", { userId, requestId });

    // Find the user
    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the request to get product_id if it exists
    const request = user.publish_requests?.find(
      (r) => r.request_id === requestId,
    );

    // Remove from publish_requests
    const pullResult = await usersCollection.updateOne(
      { user_id: userId },
      { $pull: { publish_requests: { request_id: requestId } } },
    );
    console.log("Reject pull result:", pullResult);

    // Add to published_items with rejected status
    const pushResult = await usersCollection.updateOne(
      { user_id: userId },
      {
        $push: {
          published_items: {
            product_id: request?.product_id || null,
            status: "rejected",
            views: 0,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );
    console.log("Reject push result:", pushResult);

    res.json({ success: true, message: "Зар буцаагдлаа." });
  } catch (error) {
    console.error("Reject error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ========== GENERAL USER ROUTE - MUST BE LAST! ==========
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const collection = db.collection("users");

    const user = await collection.findOne(
      { user_id: userId },
      { projection: { password: 0 } },
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/notifications
router.get("/:userId/notifications", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const user = await db
      .collection("users")
      .findOne(
        { user_id: req.params.userId },
        { projection: { notifications: 1 } },
      );
    res.json(user?.notifications || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/notifications/read
router.put("/:userId/notifications/read", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    await db
      .collection("users")
      .updateOne(
        { user_id: req.params.userId },
        { $set: { "notifications.$[].read": true } },
      );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/rentals — түрээсийн жагсаалт (product.status-аас авна)
router.get("/:userId/rentals", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const user = await db
      .collection("users")
      .findOne(
        { user_id: req.params.userId },
        { projection: { rented_items: 1 } },
      );

    const items = user?.rented_items || [];

    const productIds = items
      .map((i) => i.product_id)
      .filter((id) => id != null);
    const products = await db
      .collection("product")
      .find({
        id: { $in: productIds },
      })
      .toArray();

    const result = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        ...item,
        name: product?.item_name || item.name || "Unknown",
        brand: product?.brand || item.brand || "",
        img: product?.img_src || item.img || "",
        price: product?.price || item.price || 0,
        size: product?.sizes?.join(", ") || item.size || "",
        status: item.status || "paid",
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:userId/rentals/:rentalId — rental статус өөрчлөх (product.status-д)
router.put("/:userId/rentals/:rentalId", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("product");

    const { userId, rentalId } = req.params;
    const newStatus = req.body.status;

    const user = await usersCollection.findOne(
      { user_id: userId, "rented_items.id": parseInt(rentalId) },
      { projection: { "rented_items.$": 1 } },
    );

    const rental = user?.rented_items?.[0];

    if (rental && rental.product_id != null) {
      await productsCollection.updateOne(
        { id: rental.product_id },
        { $set: { status: newStatus } },
      );
    }

    res.json({ success: true, status: newStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:userId/listings — нийтэлсэн зарууд
router.get("/:userId/listings", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("webapp-team");
    const user = await db
      .collection("users")
      .findOne(
        { user_id: req.params.userId },
        { projection: { published_items: 1 } },
      );

    const items = user?.published_items || [];
    const productIds = items
      .map((i) => i.product_id)
      .filter((id) => id != null);

    const products = await db
      .collection("product")
      .find({
        id: { $in: productIds },
      })
      .toArray();

    const result = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      return {
        ...item,
        name: product?.item_name || item.name || "Unknown",
        brand: product?.brand || item.brand || "",
        price: product?.price || item.price || "",
        img: product?.img_src || item.img || "",
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ── GET /api/users/:userId/publish-requests ───────────────
router.get("/:userId/publish-requests", async (req, res) => {
  try {
    const db = await getDB();
    const user = await db
      .collection("users")
      .findOne(
        { user_id: req.params.userId },
        { projection: { publish_requests: 1 } },
      );
    res.json(user?.publish_requests || []);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/users/:userId/publish-request ───────────────
router.post("/:userId/publish-request", async (req, res) => {
  try {
    const db = await getDB();

    const newRequest = {
      request_id: "req_" + Date.now(),
      name: req.body.name || "",
      brand: req.body.brand || "",
      price: req.body.price || "",
      category: req.body.category || "",
      size: req.body.size || "",
      description: req.body.description || "",
      img: req.body.img || "",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    await db
      .collection("users")
      .updateOne(
        { user_id: req.params.userId },
        { $push: { publish_requests: newRequest } },
      );

    res.status(201).json(newRequest);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/users/:userId/publish-request/:requestId/approve
router.put("/:userId/publish-request/:requestId/approve", async (req, res) => {
  try {
    const db = await getDB();
    const { userId, requestId } = req.params;

    const user = await db.collection("users").findOne({ user_id: userId });
    if (!user) return res.status(404).json({ error: "User олдсонгүй" });

    const request = user.publish_requests?.find(
      (r) => r.request_id === requestId,
    );
    if (!request) return res.status(404).json({ error: "Request олдсонгүй" });

    // 1. product collection-д шинэ бараа нэмэх
    const productCollection = db.collection("product");
    const last = await productCollection
      .find()
      .sort({ id: -1 })
      .limit(1)
      .toArray();
    const newId = last.length ? (last[0].id || 0) + 1 : 1;

    const newProduct = {
      id: newId,
      brand: request.brand || "",
      publisher: user.username || "",
      item_name: request.name || "",
      rating: 0,
      review_count: 0,
      price: request.price || "",
      price_period: "өдрөөс",
      status: "standard",
      category: request.category || "",
      description: request.description || "",
      img_src: request.img || "",
      sizes: request.size ? request.size.split("/") : ["S", "M", "L"],
      in_stock: 1,
      date_posted: new Date().toISOString().split("T")[0],
    };

    await productCollection.insertOne(newProduct);

    // 2. publish_requests-с $pull хийж хасах
    await db
      .collection("users")
      .updateOne(
        { user_id: userId },
        { $pull: { publish_requests: { request_id: requestId } } },
      );

    // 3. published_items-д нэмэх
    await db.collection("users").updateOne(
      { user_id: userId },
      {
        $push: {
          published_items: {
            product_id: newId,
            status: "published",
            views: 0,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );

    // 4. Notification нэмэх
    await db.collection("users").updateOne(
      { user_id: userId },
      {
        $push: {
          notifications: {
            id: Date.now(),
            type: "publish",
            message: '"' + request.name + '" зар нийтлэгдлээ ✓',
            read: false,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );

    res.json({ success: true, product: newProduct });
  } catch (e) {
    console.error("Approve error:", e);
    res.status(500).json({ error: e.message });
  }
});

// ── PUT /api/users/:userId/publish-request/:requestId/reject
router.put("/:userId/publish-request/:requestId/reject", async (req, res) => {
  try {
    const db = await getDB();
    const { userId, requestId } = req.params;

    const user = await db.collection("users").findOne({ user_id: userId });
    if (!user) return res.status(404).json({ error: "User олдсонгүй" });

    const request = user.publish_requests?.find(
      (r) => r.request_id === requestId,
    );
    if (!request) return res.status(404).json({ error: "Request олдсонгүй" });

    // 1. publish_requests-с хасах
    await db
      .collection("users")
      .updateOne(
        { user_id: userId },
        { $pull: { publish_requests: { request_id: requestId } } },
      );

    // 2. published_items-д rejected status-тай нэмэх
    await db.collection("users").updateOne(
      { user_id: userId },
      {
        $push: {
          published_items: {
            product_id: requestId,
            status: "rejected",
            views: 0,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );

    // 3. Notification нэмэх
    await db.collection("users").updateOne(
      { user_id: userId },
      {
        $push: {
          notifications: {
            id: Date.now(),
            type: "publish",
            message: '"' + request.name + '" зар буцаагдлаа',
            read: false,
            createdAt: new Date().toISOString(),
          },
        },
      },
    );

    res.json({ success: true });
  } catch (e) {
    console.error("Reject error:", e);
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/:userId/publish-request/:requestId — засах
router.put('/:userId/publish-request/:requestId', async (req, res) => {
  try {
    const db = await getDB();
    const { userId, requestId } = req.params;

    await db.collection('users').updateOne(
      { user_id: userId, 'publish_requests.request_id': requestId },
      {
        $set: {
          'publish_requests.$.name':        req.body.name        || '',
          'publish_requests.$.brand':       req.body.brand       || '',
          'publish_requests.$.price':       req.body.price       || '',
          'publish_requests.$.size':        req.body.size        || '',
          'publish_requests.$.description': req.body.description || '',
          'publish_requests.$.category':    req.body.category    || '',
          'publish_requests.$.img':         req.body.img         || '',
        }
      }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/users/:userId/publish-request/:requestId — устгах
router.delete('/:userId/publish-request/:requestId', async (req, res) => {
  try {
    const db = await getDB();
    const { userId, requestId } = req.params;

    await db.collection('users').updateOne(
      { user_id: userId },
      { $pull: { publish_requests: { request_id: requestId } } }
    );
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});


// ========== LIKED ITEMS ROUTES ==========
router.get('/:userId/liked', async (req, res) => {
  try {
    const { userId } = req.params;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne(
      { user_id: userId },
      { projection: { liked_items: 1, username: 1 } }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: userId,
      username: user.username,
      liked_items: user.liked_items || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:userId/liked/toggle', async (req, res) => {
  try {
    const { userId } = req.params;
    const { product_id } = req.body;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const likedItems = user.liked_items || [];
    const index = likedItems.indexOf(product_id);

    let action;
    if (index === -1) {
      await usersCollection.updateOne(
        { user_id: userId },
        { $push: { liked_items: product_id } }
      );
      action = 'added';
    } else {
      await usersCollection.updateOne(
        { user_id: userId },
        { $pull: { liked_items: product_id } }
      );
      action = 'removed';
    }

    res.json({
      success: true,
      action: action,
      liked: action === 'added'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== REVIEWS ROUTES ==========
router.post('/:userId/reviews', async (req, res) => {
  try {
    const { userId } = req.params;
    const { rental_id, rating, comment } = req.body;
    await client.connect();
    const db = client.db("webapp-team");
    const usersCollection = db.collection("users");
    const productsCollection = db.collection("product");

    const user = await usersCollection.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rental = user.rented_items?.find(r => r.rental_id === rental_id);
    if (!rental) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    await usersCollection.updateOne(
      { user_id: userId, 'rented_items.rental_id': rental_id },
      {
        $set: {
          'rented_items.$.reviewed': true,
          'rented_items.$.review_rating': rating,
          'rented_items.$.review_comment': comment,
          'rented_items.$.reviewed_at': new Date().toISOString()
        }
      }
    );

    const product = await productsCollection.findOne({ id: rental.product_id });
    if (product) {
      const newReview = {
        user_id: userId,
        name: user.full_name || user.username,
        rating: rating,
        comment: comment,
        createdAt: new Date().toISOString()
      };

      await productsCollection.updateOne(
        { id: rental.product_id },
        {
          $push: { reviews: newReview },
          $inc: { review_count: 1 }
        }
      );

      const updatedProduct = await productsCollection.findOne({ id: rental.product_id });
      const reviews = updatedProduct.reviews || [];
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      await productsCollection.updateOne(
        { id: rental.product_id },
        { $set: { rating: Math.round(avgRating * 10) / 10 } }
      );
    }

    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Review submit error:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
