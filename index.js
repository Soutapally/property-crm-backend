import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./db.js";

dotenv.config();
// const express = require('express');
// const mysql = require('mysql2');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 5000;

// app.use(cors());
app.use(cors({
  origin: "*"
}));

app.use(bodyParser.json());

// MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '', // default for XAMPP
//   database: 'realestate_crm',
// });
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB connection failed" });
  }
});


// db.connect((err) => {
//   if (err) {
//     console.error('DB connection failed:', err);
//   } else {
//     console.log('MySQL connected');
//   }
// });


//ADMIN – CREATE USER
app.post("/api/admin/create-user", async (req, res) => {
  const { name, email, password, role } = req.body;

  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES ($1, $2, $3, $4)
  `;

  try {
    await db.query(sql, [name, email, password, role]);

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ message: "User already exists or DB error" });
  }
});



// app.post("/api/admin/create-user", async (req, res) => {
//   const { name, email, password, role, loggedInUser } = req.body;

//   // ✅ ROLE CHECK
//   if (!loggedInUser || loggedInUser.role !== "ADMIN") {
//     return res.status(403).json({ message: "Access denied" });
//   }

//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const sql = `
//       INSERT INTO users (name, email, password, role)
//       VALUES (?, ?, ?, ?)
//     `;

//     db.query(sql, [name, email, hashedPassword, role], (err) => {
//       if (err) {
//         console.error(err);
//         return res
//           .status(500)
//           .json({ message: "User already exists or DB error" });
//       }

//       res.json({ message: "User created successfully" });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

//LOGIN API
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const sql = `
    SELECT *
    FROM users
    WHERE email = $1 AND is_active = true
  `;

  try {
    const result = await db.query(sql, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // ⚠️ SAME LOGIC — plain text comparison
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "DB Error" });
  }
});


// GET all users (admin usage)
app.get("/api/admin/users", async (req, res) => {
  const sql = `
    SELECT user_id, name, email, role, is_active, created_at
    FROM users
    ORDER BY created_at DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "DB error" });
  }
});


// API to SAVE Customer
// API to SAVE Customer
app.post("/api/add-customer", async (req, res) => {
  const { 
    name, 
    phone, 
    phone_alt,
    email, 
    budget_from, 
    budget_to, 
    location, 
    property_type, 
    requirement, 
    status 
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name & Phone number required" });
  }

  // ✅ SAME LOGIC — NULL instead of empty string
  const emailValue = email && email.trim() !== "" ? email : null;

  const sql = `
    INSERT INTO customers 
    (
      name, phone, phone_alt, email,
      budget_min, budget_max,
      preferred_location, property_type,
      requirement_details, lead_status
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `;

  try {
    await db.query(sql, [
      name,
      phone,
      phone_alt,
      emailValue,
      budget_from,
      budget_to,
      location,
      property_type,
      requirement,
      status
    ]);

    res.json({ message: "Customer stored successfully!" });
  } catch (err) {
    console.error("❌ Insert failed:", err);
    return res.status(500).json({ message: "Database insert error" });
  }
});



// ⭐ GET all customers
// ⭐ GET all customers
app.get("/api/customers", async (req, res) => {
  const sql = `
    SELECT 
      customer_id, name, email, phone, phone_alt,   
      budget_min, budget_max,
      preferred_location, property_type,
      requirement_details, lead_status,
      created_at
    FROM customers
    ORDER BY customer_id DESC
  `;

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


// ⭐ GET single customer by ID
app.get("/api/customer/:id", async (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      customer_id,
      name,
      email,
      phone,
      phone_alt,
      budget_min,
      budget_max,
      preferred_location,
      property_type,
      requirement_details,
      lead_status,
      created_at
    FROM customers
    WHERE customer_id = $1
  `;

  try {
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Fetch customer failed:", err);
    res.status(500).json({ message: "DB error" });
  }
});


//Get one customer id to edit customer 
// GET single user by ID (for edit)
app.get("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT user_id, name, email, role, is_active
    FROM users
    WHERE user_id = $1
  `;

  try {
    const result = await db.query(sql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "DB error" });
  }
});


//update api to update the customers info
// Update the customer info
// UPDATE user
app.put("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, role, is_active } = req.body;

  const sql = `
    UPDATE users
    SET name = $1, email = $2, role = $3, is_active = $4
    WHERE user_id = $5
  `;

  try {
    const result = await db.query(sql, [
      name,
      email,
      role,
      is_active,
      id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});


// 🗑️ DELETE customer
// DELETE user
app.delete("/api/admin/users/:id", async (req, res) => {
  const { id } = req.params;

  const sql = `DELETE FROM users WHERE user_id = $1`;

  try {
    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});


// API TO ADD SELLER / CLIENT
// API TO ADD SELLER / CLIENT
app.post("/api/add-seller", async (req, res) => {
  const { 
    name, phone, email, address, city, district, 
    seller_type, property_name, property_type, notes 
  } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ message: "Name & Phone are required" });
  }

  const emailValue = email && email.trim() !== "" ? email : null;

  const sql = `
    INSERT INTO sellers 
    (name, phone, email, address, city, district, seller_type, property_name, property_type, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
  `;

  try {
    await db.query(sql, [
      name,
      phone,
      emailValue,
      address,
      city,
      district,
      seller_type,
      property_name,
      property_type,
      notes
    ]);

    res.json({ message: "Seller saved successfully!" });
  } catch (err) {
    console.error("❌ Seller Insert Error:", err);
    res.status(500).json({ message: "Database insert error" });
  }
});


// 📌 Fetch all sellers
app.get("/api/sellers", async (req, res) => {
  const sql = "SELECT * FROM sellers ORDER BY seller_id DESC";

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching sellers:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


// 📌 Fetch single seller by ID
app.get("/api/seller/:id", async (req, res) => {
  const sellerId = req.params.id;

  const sql = "SELECT * FROM sellers WHERE seller_id = $1";

  try {
    const result = await db.query(sql, [sellerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching seller:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


// 📌 Update seller details
app.put("/api/update-seller/:id", async (req, res) => {
  const sellerId = req.params.id;

  const {
    name,
    phone,
    email,
    address,
    city,
    district,
    seller_type,
    property_name,
    property_type,
    notes
  } = req.body;

  const emailValue = email && email.trim() !== "" ? email : null;

  const sql = `
    UPDATE sellers SET 
      name = $1,
      phone = $2,
      email = $3,
      address = $4,
      city = $5,
      district = $6,
      seller_type = $7,
      property_name = $8,
      property_type = $9,
      notes = $10
    WHERE seller_id = $11
  `;

  try {
    const result = await db.query(sql, [
      name,
      phone,
      emailValue,
      address,
      city,
      district,
      seller_type,
      property_name,
      property_type,
      notes,
      sellerId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ message: "Seller updated successfully!" });
  } catch (err) {
    console.error("❌ Error updating seller:", err);
    res.status(500).json({ message: "Database update error" });
  }
});


// 🗑️ DELETE seller / client
app.delete("/api/delete-seller/:id", async (req, res) => {
  const sellerId = req.params.id;

  const sql = "DELETE FROM sellers WHERE seller_id = $1";

  try {
    const result = await db.query(sql, [sellerId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ message: "Seller deleted successfully!" });
  } catch (err) {
    console.error("❌ Error deleting seller:", err);
    res.status(500).json({ message: "Database delete error" });
  }
});

//ADD PROPERTY
app.post("/api/add-property", async (req, res) => {
  const {
    seller_id,
    property_name,
    property_type,
    price,
    area_value,
    area_unit,
    facing_direction,
    mandal,
    address,
    district,
    availability,
    description
  } = req.body;

  if (!seller_id || !property_name) {
    return res.status(400).json({
      message: "Seller ID & Property Name are required"
    });
  }

  const sql = `
    INSERT INTO properties 
    (
      seller_id, property_name, property_type,
      price, area_value, area_unit,
      facing_direction, mandal, address, district,
      availability, description
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
  `;

  try {
    await db.query(sql, [
      seller_id,
      property_name,
      property_type,
      price,
      area_value,
      area_unit,
      facing_direction,
      mandal,
      address,
      district,
      availability,
      description
    ]);

    res.status(200).json({ message: "Property saved successfully!" });
  } catch (err) {
    console.error("❌ Property Insert Error:", err);
    res.status(500).json({ message: "Database insert error" });
  }
});



// GET ALL PROPERTIES (with seller name)
app.get("/api/properties", async (req, res) => {
  const sql = `
    SELECT 
      p.*, 
      s.name AS owner_name
    FROM properties p
    LEFT JOIN sellers s ON p.seller_id = s.seller_id
    ORDER BY p.property_id DESC
  `;

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching properties:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


// GET Single Property by ID
app.get("/api/property/:id", async (req, res) => {
  const propertyId = req.params.id;

  const sql = `
    SELECT 
      p.*, 
      s.name AS owner_name
    FROM properties p
    LEFT JOIN sellers s ON p.seller_id = s.seller_id
    WHERE p.property_id = $1
  `;

  try {
    const result = await db.query(sql, [propertyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error fetching property:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


//Update the property details in the properties table
app.put("/api/update-property/:id", async (req, res) => {
  const propertyId = req.params.id;

  const {
    seller_id,
    property_name,
    property_type,
    price,
    area_value,
    area_unit,
    facing_direction,
    mandal,
    address,
    district,
    availability,
    description
  } = req.body;

  const sql = `
    UPDATE properties SET
      seller_id = $1,
      property_name = $2,
      property_type = $3,
      price = $4,
      area_value = $5,
      area_unit = $6,
      facing_direction = $7,
      mandal = $8,
      address = $9,
      district = $10,
      availability = $11,
      description = $12
    WHERE property_id = $13
  `;

  try {
    const result = await db.query(sql, [
      seller_id,
      property_name,
      property_type,
      price,
      area_value,
      area_unit,
      facing_direction,
      mandal,
      address,
      district,
      availability,
      description,
      propertyId
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.status(200).json({ message: "Property updated successfully!" });
  } catch (err) {
    console.error("❌ Property Update Error:", err);
    res.status(500).json({ message: "Database update error" });
  }
});


// 🗑️ DELETE PROPERTY
app.delete("/api/delete-property/:id", async (req, res) => {
  const propertyId = req.params.id;

  const sql = "DELETE FROM properties WHERE property_id = $1";

  try {
    const result = await db.query(sql, [propertyId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({ message: "Property deleted successfully!" });
  } catch (err) {
    console.error("❌ Property Delete Error:", err);
    res.status(500).json({ message: "Database delete error" });
  }
});


// GET ALL SELLERS (id + name)
app.get("/api/sellers", async (req, res) => {
  const sql = "SELECT seller_id, name FROM sellers ORDER BY seller_id DESC";

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching sellers:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


// GET ALL CUSTOMERS (ID + Name for followup form dropdown)
app.get("/api/customers-list", async (req, res) => {
  const sql = "SELECT customer_id, name FROM customers ORDER BY name ASC";

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching customer list:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


//saving the followups to db
// ⭐ SAVE follow-up WITH property_id
app.post("/api/add-followup", async (req, res) => {
  const { customer_id, property_ids, next_followup_at, status, notes } = req.body;

  const followupSql = `
    INSERT INTO followups (customer_id, next_followup_at, status, notes)
    VALUES ($1, $2, $3, $4)
    RETURNING followup_id
  `;

  try {
    const result = await db.query(followupSql, [
      customer_id,
      next_followup_at,
      status,
      notes
    ]);

    const followupId = result.rows[0].followup_id;

    if (property_ids && property_ids.length > 0) {
      const values = property_ids
        .map((_, i) => `($1, $${i + 2})`)
        .join(",");

      const mapSql = `
        INSERT INTO followup_properties (followup_id, property_id)
        VALUES ${values}
      `;

      await db.query(mapSql, [followupId, ...property_ids]);
    }

    res.json({ message: "Follow-up saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Followup insert failed" });
  }
});



//get api for getting all followups
// ⭐ GET all followups with customer + property
app.get("/api/followups", async (req, res) => {
  const sql = `
    SELECT 
      f.followup_id,
      f.next_followup_at,
      f.status,
      f.notes,
      c.name AS customer_name,
      STRING_AGG(p.property_name, ', ') AS properties
    FROM followups f
    LEFT JOIN customers c ON c.customer_id = f.customer_id
    LEFT JOIN followup_properties fp ON fp.followup_id = f.followup_id
    LEFT JOIN properties p ON p.property_id = fp.property_id
    GROUP BY f.followup_id, c.name
    ORDER BY f.next_followup_at ASC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json(err);
  }
});


//GET api to get one followup 
// ⭐ GET one followup (for EDIT)
app.get("/api/edit-followup/:id", async (req, res) => {
  const sql = `
    SELECT 
      f.followup_id,
      f.customer_id,
      f.next_followup_at,
      f.status,
      f.notes,
      STRING_AGG(fp.property_id::text, ',') AS property_ids
    FROM followups f
    LEFT JOIN followup_properties fp 
      ON fp.followup_id = f.followup_id
    WHERE f.followup_id = $1
    GROUP BY f.followup_id
  `;

  try {
    const result = await db.query(sql, [req.params.id]);

    if (!result.rows.length) return res.json(null);

    const row = result.rows[0];
    row.property_ids = row.property_ids
      ? row.property_ids.split(",").map(Number)
      : [];

    res.json(row);
  } catch (err) {
    res.status(500).json(err);
  }
});


//updating the followups
// ⭐ UPDATE followup WITH property_id
app.put("/api/update-followup/:id", async (req, res) => {
  const { customer_id, property_ids, next_followup_at, status, notes } = req.body;
  const followupId = req.params.id;

  const updateSql = `
    UPDATE followups
    SET customer_id=$1, next_followup_at=$2, status=$3, notes=$4
    WHERE followup_id=$5
  `;

  try {
    await db.query(updateSql, [
      customer_id,
      next_followup_at,
      status,
      notes,
      followupId
    ]);

    // delete old mappings
    await db.query(
      "DELETE FROM followup_properties WHERE followup_id=$1",
      [followupId]
    );

    if (property_ids && property_ids.length > 0) {
      const values = property_ids
        .map((_, i) => `($1, $${i + 2})`)
        .join(",");

      const insertSql = `
        INSERT INTO followup_properties (followup_id, property_id)
        VALUES ${values}
      `;

      await db.query(insertSql, [followupId, ...property_ids]);
    }

    res.json({ message: "Follow-up updated!" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});





//To get the properties list from properties table from db
// ⭐ API: Get all properties (for dropdown)
app.get("/api/properties-list", async (req, res) => {
  const sql = "SELECT property_id, property_name FROM properties ORDER BY property_id DESC";

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json(err);
  }
});


// ADD Property Type
app.post("/api/property-type", async (req, res) => {
  const { type_name } = req.body;

  if (!type_name) {
    return res.status(400).json({ message: "Property Type is required" });
  }

  const sql = "INSERT INTO property_types (type_name) VALUES ($1)";

  try {
    await db.query(sql, [type_name]);
    res.status(200).json({ message: "Property Type added successfully!" });
  } catch (err) {
    console.error("❌ Insert error:", err);
    res.status(500).json({ message: "Database insert error" });
  }
});


// GET all property types
app.get("/api/property-types", async (req, res) => {
  const sql = "SELECT * FROM property_types ORDER BY type_id DESC";

  try {
    const result = await db.query(sql);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});

//UPDATE PROPERTY TYPE
app.put("/api/property-type/:id", async (req, res) => {
  const { id } = req.params;
  const { type_name } = req.body;

  const sql = "UPDATE property_types SET type_name=$1 WHERE type_id=$2";

  try {
    await db.query(sql, [type_name, id]);
    res.json({ message: "Property Type updated!" });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// 🗑️ DELETE property type
app.delete("/api/property-type/:id", async (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM property_types WHERE type_id=$1";

  try {
    const result = await db.query(sql, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Property Type not found" });
    }

    res.json({ message: "Property Type deleted successfully!" });
  } catch (err) {
    console.error("❌ Delete error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});



// ⭐ ADD SITE VISIT
// app.post("/api/add-site-visit", (req, res) => {
//   const { customer_id, property_id, visit_datetime, status, feedback } = req.body;

//   const sql = `
//     INSERT INTO site_visits
//     (customer_id, property_id, visit_datetime, status, feedback)
//     VALUES (?, ?, ?, ?, ?)
//   `;

//   db.query(
//     sql,
//     [customer_id, property_id, visit_datetime, status, feedback],
//     (err) => {
//       if (err) {
//         console.error("❌ Site visit insert error:", err);
//         return res.status(500).json({ message: "DB Error" });
//       }
//       res.json({ message: "Site visit added!" });
//     }
//   );
// });
// ⭐ ADD MULTIPLE SITE VISITS
// app.post("/api/add-site-visit-multiple", (req, res) => {
//   const { customer_id, visit_datetime, properties } = req.body;

//   if (!customer_id || !visit_datetime || !Array.isArray(properties) || !properties.length) {
//     return res.status(400).json({ message: "Invalid payload" });
//   }

//   // 1️⃣ Insert parent visit
//   const visitSql = `
//     INSERT INTO site_visits (customer_id, visit_datetime)
//     VALUES (?, ?)
//   `;

//   db.query(visitSql, [customer_id, visit_datetime], (err, result) => {
//     if (err) {
//       console.error("❌ site_visits insert:", err);
//       return res.status(500).json({ message: "Visit insert failed" });
//     }

//     const siteVisitId = result.insertId;

//     // 2️⃣ Insert child properties
//     const propSql = `
//       INSERT INTO site_visit_properties
//       (site_visit_id, property_id, status, feedback)
//       VALUES ?
//     `;

//     const values = properties.map(p => [
//       siteVisitId,
//       p.property_id,
//       p.status || "Scheduled",
//       p.feedback || ""
//     ]);

//     db.query(propSql, [values], (err2) => {
//       if (err2) {
//         console.error("❌ properties insert:", err2);
//         return res.status(500).json({ message: "Property insert failed" });
//       }

//       res.json({ message: "Site visit saved successfully" });
//     });
//   });
// });
// app.post("/api/add-site-visit-multiple", (req, res) => {
//   const { customer_id, visit_datetime, followup_date, properties } = req.body;

//   if (!customer_id || !visit_datetime || !Array.isArray(properties) || !properties.length) {
//     return res.status(400).json({ message: "Invalid payload" });
//   }

//   // 1️⃣ INSERT SITE VISIT
//   db.query(
//     `INSERT INTO site_visits (customer_id, visit_datetime)
//      VALUES (?, ?)`,
//     [customer_id, visit_datetime],
//     (err, visitResult) => {
//       if (err) {
//         console.error("Site visit insert error:", err);
//         return res.status(500).json({ message: "Site visit insert failed" });
//       }

//       const siteVisitId = visitResult.insertId;

//       // 2️⃣ INSERT SITE VISIT PROPERTIES
//       const siteVisitProps = properties.map(p => [
//         siteVisitId,
//         p.property_id,
//         p.status || "Scheduled",
//         p.feedback || ""
//       ]);

//       db.query(
//         `INSERT INTO site_visit_properties
//          (site_visit_id, property_id, status, feedback)
//          VALUES ?`,
//         [siteVisitProps],
//         (err2) => {
//           if (err2) {
//             console.error("Site visit properties insert error:", err2);
//             return res.status(500).json({ message: "Site visit properties insert failed" });
//           }

//           // 3️⃣ INSERT FOLLOW-UP (ONLY IF FOLLOW-UP DATE EXISTS)
//           if (!followup_date) {
//             return res.json({ message: "Site visit saved successfully (no follow-up)" });
//           }

//           db.query(
//             `INSERT INTO followups
//              (customer_id, next_followup_at, notes, status, source, source_ref_id)
//              VALUES (?, ?, ?, 'Pending', 'SITE_VISIT', ?)`,
//             [
//               customer_id,
//               followup_date,
//               "Follow-up from site visit",
//               siteVisitId
//             ],
//             (err3, followupResult) => {
//               if (err3) {
//                 console.error("Followup insert error:", err3);
//                 return res.json({ message: "Site visit saved, follow-up failed" });
//               }

//               const followupId = followupResult.insertId;

//               // 4️⃣ INSERT FOLLOW-UP PROPERTIES (⭐ IMPORTANT)
//               const followupProps = properties.map(p => [
//                 followupId,
//                 p.property_id
//               ]);

//               db.query(
//                 `INSERT INTO followup_properties
//                  (followup_id, property_id)
//                  VALUES ?`,
//                 [followupProps],
//                 (err4) => {
//                   if (err4) {
//                     console.error("Followup properties insert error:", err4);
//                     return res.json({
//                       message: "Site visit saved, follow-up saved, property link failed"
//                     });
//                   }

//                   res.json({
//                     message: "Site visit + follow-up saved successfully"
//                   });
//                 }
//               );
//             }
//           );
//         }
//       );
//     }
//   );
// });
//ADD SITE VISIT (MULTIPLE PROPERTIES + FOLLOWUP)
app.post("/api/add-site-visit-multiple", async (req, res) => {
  const {
    customer_id,
    visit_datetime,
    followup_datetime,
    properties
  } = req.body;

  if (!customer_id || !visit_datetime) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    /* 1️⃣ INSERT SITE VISIT */
    const visitResult = await db.query(
      `INSERT INTO site_visits (customer_id, visit_datetime)
       VALUES ($1, $2)
       RETURNING site_visit_id`,
      [customer_id, visit_datetime]
    );

    const siteVisitId = visitResult.rows[0].site_visit_id;

    /* 2️⃣ INSERT VISITED PROPERTIES */
    if (properties && properties.length > 0) {
      const values = properties
        .map((_, i) => `($1, $${i * 3 + 2}, $${i * 3 + 3}, $${i * 3 + 4})`)
        .join(",");

      const params = [
        siteVisitId,
        ...properties.flatMap(p => [
          p.property_id,
          p.status || "Scheduled",
          p.feedback || ""
        ])
      ];

      await db.query(
        `INSERT INTO site_visit_properties
         (site_visit_id, property_id, status, feedback)
         VALUES ${values}`,
        params
      );
    }

    /* 3️⃣ FOLLOW-UP (OPTIONAL) */
    if (followup_datetime) {
      const followupResult = await db.query(
        `INSERT INTO followups
         (customer_id, next_followup_at, notes, status, source, source_ref_id)
         VALUES ($1,$2,$3,'Pending','SITE_VISIT',$4)
         RETURNING followup_id`,
        [
          customer_id,
          followup_datetime,
          "Follow-up from site visit",
          siteVisitId
        ]
      );

      const followupId = followupResult.rows[0].followup_id;

      if (properties && properties.length > 0) {
        const values = properties
          .map((_, i) => `($1, $${i + 2})`)
          .join(",");

        await db.query(
          `INSERT INTO followup_properties (followup_id, property_id)
           VALUES ${values}`,
          [followupId, ...properties.map(p => p.property_id)]
        );
      }
    }

    res.json({ message: "Site visit + follow-up saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Site visit failed" });
  }
});



// ⭐ GET ALL SITE VISITS
// app.get("/api/site-visits", (req, res) => {
//   const sql = `
//     SELECT 
//       sv.*,
//       c.name AS customer_name,
//       c.phone,
//       p.property_name
//     FROM site_visits sv
//     LEFT JOIN customers c ON c.customer_id = sv.customer_id
//     LEFT JOIN properties p ON p.property_id = sv.property_id
//     ORDER BY sv.visit_datetime DESC
//   `;

//   db.query(sql, (err, rows) => {
//     if (err) return res.status(500).json({ message: "DB Error" });
//     res.json(rows);
//   });
// });

// ⭐ GET ALL SITE VISITS
// ⭐ GET ALL SITE VISITS (GROUP-FRIENDLY)
//GET ALL SITE VISITS (GROUPED RESPONSE)
app.get("/api/site-visits", async (req, res) => {
  const sql = `
    SELECT
      sv.site_visit_id,
      sv.visit_datetime,
      c.name AS customer_name,
      p.property_name,
      svp.status,
      svp.feedback
    FROM site_visits sv
    JOIN customers c ON c.customer_id = sv.customer_id
    JOIN site_visit_properties svp ON svp.site_visit_id = sv.site_visit_id
    JOIN properties p ON p.property_id = svp.property_id
    ORDER BY sv.visit_datetime DESC
  `;

  try {
    const result = await db.query(sql);

    const grouped = {};
    result.rows.forEach(r => {
      if (!grouped[r.site_visit_id]) {
        grouped[r.site_visit_id] = {
          visit_id: r.site_visit_id,
          customer_name: r.customer_name,
          visit_datetime: r.visit_datetime,
          properties: []
        };
      }

      grouped[r.site_visit_id].properties.push({
        property_name: r.property_name,
        status: r.status,
        feedback: r.feedback
      });
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});



// ⭐ GET SITE VISIT GROUP (FOR EDIT)
// app.get("/api/site-visit-group/:id", (req, res) => {
//   const sql = `
//     SELECT
//       sv.site_visit_id,
//       sv.customer_id,
//       sv.visit_datetime,

//       svp.visit_property_id,
//       svp.property_id,
//       svp.status,
//       svp.feedback

//     FROM site_visits sv
//     JOIN site_visit_properties svp
//       ON svp.site_visit_id = sv.site_visit_id

//     WHERE sv.site_visit_id = ?
//   `;

//   db.query(sql, [req.params.id], (err, rows) => {
//     if (err) {
//       console.error("❌ Edit fetch error:", err);
//       return res.status(500).json({ message: "DB Error" });
//     }

//     res.json(rows);
//   });
// });
app.get("/api/site-visit-group/:id", async (req, res) => {
  const sql = `
    SELECT
      sv.site_visit_id,
      sv.customer_id,
      sv.visit_datetime,

      svp.visit_property_id,
      svp.property_id,
      svp.status,
      svp.feedback,

      f.next_followup_at AS followup_datetime
    FROM site_visits sv
    JOIN site_visit_properties svp
      ON svp.site_visit_id = sv.site_visit_id
    LEFT JOIN followups f
      ON f.source = 'SITE_VISIT'
     AND f.source_ref_id = sv.site_visit_id
    WHERE sv.site_visit_id = $1
  `;

  try {
    const result = await db.query(sql, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Edit fetch error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});



// ⭐ UPDATE SITE VISIT(WITH FOLLOWUP)
// app.put("/api/update-site-visit/:id", (req, res) => {
//   const visitId = req.params.id;
//   const { customer_id, visit_datetime, followup_date, properties } = req.body;

//   if (!customer_id || !visit_datetime || !Array.isArray(properties)) {
//     return res.status(400).json({ message: "Invalid payload" });
//   }

//   /* ================= 1️⃣ UPDATE SITE VISIT ================= */
//   db.query(
//     `UPDATE site_visits
//      SET customer_id = ?, visit_datetime = ?
//      WHERE site_visit_id = ?`,
//     [customer_id, visit_datetime, visitId],
//     (err) => {
//       if (err) {
//         console.error("❌ Visit update error:", err);
//         return res.status(500).json({ message: "Visit update failed" });
//       }

//       /* ========== 2️⃣ REPLACE SITE VISIT PROPERTIES ========== */
//       db.query(
//         `DELETE FROM site_visit_properties WHERE site_visit_id = ?`,
//         [visitId],
//         (err2) => {
//           if (err2) {
//             console.error("❌ Site visit property delete error:", err2);
//             return res.status(500).json({ message: "Cleanup failed" });
//           }

//           const siteVisitProps = properties.map(p => [
//             visitId,
//             p.property_id,
//             p.status || "Scheduled",
//             p.feedback || ""
//           ]);

//           db.query(
//             `INSERT INTO site_visit_properties
//              (site_visit_id, property_id, status, feedback)
//              VALUES ?`,
//             [siteVisitProps],
//             (err3) => {
//               if (err3) {
//                 console.error("❌ Site visit property insert error:", err3);
//                 return res.status(500).json({ message: "Property update failed" });
//               }

//               /* ========== 3️⃣ HANDLE FOLLOWUP (ONLY SITE_VISIT SOURCE) ========== */
//               db.query(
//                 `SELECT followup_id
//                  FROM followups
//                  WHERE source = 'SITE_VISIT'
//                    AND source_ref_id = ?`,
//                 [visitId],
//                 (err4, rows) => {
//                   if (err4) {
//                     console.error("❌ Followup lookup error:", err4);
//                     return res.json({ message: "Visit updated (followup skipped)" });
//                   }

//                   // No follow-up exists → nothing to sync
//                   if (!rows.length) {
//                     return res.json({ message: "Site visit updated successfully" });
//                   }

//                   const followupId = rows[0].followup_id;

//                   /* 4️⃣ Update follow-up date ONLY IF provided */
//                   if (followup_date) {
//                     db.query(
//                       `UPDATE followups
//                        SET next_followup_at = ?
//                        WHERE followup_id = ?`,
//                       [followup_date, followupId]
//                     );
//                   }

//                   /* 5️⃣ REPLACE FOLLOWUP_PROPERTIES (ONLY THIS FOLLOWUP) */
//                   db.query(
//                     `DELETE FROM followup_properties WHERE followup_id = ?`,
//                     [followupId],
//                     () => {
//                       const followupProps = properties.map(p => [
//                         followupId,
//                         p.property_id
//                       ]);

//                       db.query(
//                         `INSERT INTO followup_properties
//                          (followup_id, property_id)
//                          VALUES ?`,
//                         [followupProps],
//                         (err5) => {
//                           if (err5) {
//                             console.error("❌ Followup property insert error:", err5);
//                             return res.json({
//                               message: "Visit updated, follow-up updated, property link failed"
//                             });
//                           }

//                           res.json({
//                             message: "Site visit + follow-up updated successfully"
//                           });
//                         }
//                       );
//                     }
//                   );
//                 }
//               );
//             }
//           );
//         }
//       );
//     }
//   );
// });
app.put("/api/update-site-visit/:id", async (req, res) => {
  const visitId = req.params.id;
  const {
    customer_id,
    visit_datetime,
    followup_datetime,
    properties
  } = req.body;

  if (!customer_id || !visit_datetime || !Array.isArray(properties)) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    /* 1️⃣ UPDATE SITE VISIT */
    await db.query(
      `UPDATE site_visits
       SET customer_id=$1, visit_datetime=$2
       WHERE site_visit_id=$3`,
      [customer_id, visit_datetime, visitId]
    );

    /* 2️⃣ REPLACE SITE VISIT PROPERTIES */
    await db.query(
      `DELETE FROM site_visit_properties WHERE site_visit_id=$1`,
      [visitId]
    );

    if (properties.length > 0) {
      const values = properties
        .map((_, i) => `($1,$${i * 3 + 2},$${i * 3 + 3},$${i * 3 + 4})`)
        .join(",");

      await db.query(
        `INSERT INTO site_visit_properties
         (site_visit_id, property_id, status, feedback)
         VALUES ${values}`,
        [
          visitId,
          ...properties.flatMap(p => [
            p.property_id,
            p.status || "Scheduled",
            p.feedback || ""
          ])
        ]
      );
    }

    /* 3️⃣ UPDATE FOLLOW-UP IF EXISTS */
    const followupRes = await db.query(
      `SELECT followup_id
       FROM followups
       WHERE source='SITE_VISIT'
         AND source_ref_id=$1`,
      [visitId]
    );

    if (!followupRes.rows.length) {
      return res.json({ message: "Site visit updated (no follow-up)" });
    }

    if (!followup_datetime) {
      return res.json({ message: "Site visit updated (follow-up unchanged)" });
    }

    const followupId = followupRes.rows[0].followup_id;

    await db.query(
      `UPDATE followups
       SET next_followup_at=$1
       WHERE followup_id=$2`,
      [followup_datetime, followupId]
    );

    await db.query(
      `DELETE FROM followup_properties WHERE followup_id=$1`,
      [followupId]
    );

    if (properties.length > 0) {
      const values = properties
        .map((_, i) => `($1,$${i + 2})`)
        .join(",");

      await db.query(
        `INSERT INTO followup_properties (followup_id, property_id)
         VALUES ${values}`,
        [followupId, ...properties.map(p => p.property_id)]
      );
    }

    res.json({ message: "Site visit + follow-up updated successfully" });
  } catch (err) {
    console.error("❌ Update site visit error:", err);
    res.status(500).json({ message: "Visit update failed" });
  }
});


// ✅ Get completed site visits for a customer
// ✅ Get completed site visits for a customer (CORRECT)
app.get("/api/customers/:id/completed-site-visits", async (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
      sv.site_visit_id,
      sv.visit_datetime,
      p.property_id,
      p.property_name,
      svp.status,
      svp.feedback
    FROM site_visits sv
    JOIN site_visit_properties svp
      ON svp.site_visit_id = sv.site_visit_id
    JOIN properties p
      ON p.property_id = svp.property_id
    WHERE sv.customer_id=$1
      AND svp.status='Completed'
    ORDER BY sv.visit_datetime DESC
  `;

  try {
    const result = await db.query(sql, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch site visits failed:", err);
    res.status(500).json({ message: "Site visit fetch failed" });
  }
});



//DELETE API(WITH FOLLOWUP CLEANUP)
app.delete("/api/site-visit/:id", async (req, res) => {
  const visitId = req.params.id;

  try {
    const followupRes = await db.query(
      `SELECT followup_id
       FROM followups
       WHERE source='SITE_VISIT'
         AND source_ref_id=$1`,
      [visitId]
    );

    const followupId = followupRes.rows.length
      ? followupRes.rows[0].followup_id
      : null;

    if (followupId) {
      await db.query(
        `DELETE FROM followup_properties WHERE followup_id=$1`,
        [followupId]
      );

      await db.query(
        `DELETE FROM followups WHERE followup_id=$1`,
        [followupId]
      );
    }

    await db.query(
      `DELETE FROM site_visit_properties WHERE site_visit_id=$1`,
      [visitId]
    );

    await db.query(
      `DELETE FROM site_visits WHERE site_visit_id=$1`,
      [visitId]
    );

    res.json({ message: "Site visit deleted successfully" });
  } catch (err) {
    console.error("❌ Delete site visit error:", err);
    res.status(500).json({ message: "Delete failed" });
  }
});


//Saving the data in sales table 
app.post("/api/add-sale", async (req, res) => {
  const {
    buyer_name,
    buyer_phone,
    seller_name,
    seller_phone,
    property_id,
    property_name,
    sale_price,
    commission_amount,
    sale_date,
    registration_date,
    loan_status,
    payment_status,
    notes
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO sales (
        buyer_name, buyer_phone, seller_name, seller_phone,
        property_id, property_name, sale_price, commission_amount,
        sale_date, registration_date, loan_status, payment_status, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING sale_id`,
      [
        buyer_name,
        buyer_phone,
        seller_name || null,
        seller_phone || null,
        property_id || null,
        property_name,
        sale_price,
        commission_amount || null,
        sale_date,
        registration_date || null,
        loan_status || "Pending",
        payment_status || "Pending",
        notes || null
      ]
    );

    res.json({
      message: "✅ Sale added successfully",
      sale_id: result.rows[0].sale_id
    });
  } catch (err) {
    console.error("❌ Error inserting sale:", err);
    res.status(500).json({ message: "DB Error" });
  }
});


//Get all sales info from db
app.get("/api/sales", async (req, res) => {
  const sql = `
    SELECT
      sale_id,
      buyer_name,
      buyer_phone,
      seller_name,
      seller_phone,
      property_name,
      sale_price,
      commission_amount,
      sale_date,
      registration_date,
      loan_status,
      payment_status,
      notes
    FROM sales
    ORDER BY sale_date DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch sales error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});

//Get one sale id from the db
app.get("/api/edit-sale/:id", async (req, res) => {
  const saleId = req.params.id;

  try {
    const result = await db.query(
      `SELECT * FROM sales WHERE sale_id=$1`,
      [saleId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Fetch sale error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});



//UPDATE SALE
app.put("/api/update-sale/:id", async (req, res) => {
  const saleId = req.params.id;
  const {
    buyer_name,
    buyer_phone,
    seller_name,
    seller_phone,
    property_id,
    property_name,
    sale_price,
    commission_amount,
    sale_date,
    registration_date,
    loan_status,
    payment_status,
    notes
  } = req.body;

  try {
    await db.query(
      `UPDATE sales SET
        buyer_name=$1,
        buyer_phone=$2,
        seller_name=$3,
        seller_phone=$4,
        property_id=$5,
        property_name=$6,
        sale_price=$7,
        commission_amount=$8,
        sale_date=$9,
        registration_date=$10,
        loan_status=$11,
        payment_status=$12,
        notes=$13
       WHERE sale_id=$14`,
      [
        buyer_name,
        buyer_phone,
        seller_name,
        seller_phone,
        property_id,
        property_name,
        sale_price,
        commission_amount,
        sale_date,
        registration_date,
        loan_status,
        payment_status,
        notes,
        saleId
      ]
    );

    res.json({ message: "Sale updated successfully!" });
  } catch (err) {
    console.error("❌ Update sale error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});



// DELETE SALE
app.delete("/api/sale/:id", async (req, res) => {
  const saleId = req.params.id;

  try {
    const result = await db.query(
      `DELETE FROM sales WHERE sale_id=$1`,
      [saleId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Sale not found" });
    }

    res.json({ message: "✅ Sale deleted successfully" });
  } catch (err) {
    console.error("❌ Delete sale error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});


//saving the finances to db
//ADD FINANCE
app.post("/api/add-finance", async (req, res) => {
  const {
    type,
    category,
    property_name,
    amount,
    record_date,
    notes,
    employee_name,
    employee_amount
  } = req.body;

  const sql = `
    INSERT INTO finances
    (type, category, property_name, amount, record_date, notes, employee_name, employee_amount)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
  `;

  try {
    await db.query(sql, [
      type,
      category,
      property_name,
      amount,
      record_date,
      notes,
      employee_name || null,
      employee_amount || null
    ]);

    res.json({ message: "Finance record added successfully" });
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


//Get all finance records
app.get("/api/finances", async (req, res) => {
  const sql = `
    SELECT * FROM finances
    ORDER BY record_date DESC
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


//Get the one finance from db
app.get("/api/finance/:id", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM finances WHERE finance_id=$1",
      [req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


//update the finance in the db
app.put("/api/finance/:id", async (req, res) => {
  const {
    type,
    category,
    property_name,
    amount,
    record_date,
    notes,
    employee_name,
    employee_amount
  } = req.body;

  const sql = `
    UPDATE finances SET
      type=$1,
      category=$2,
      property_name=$3,
      amount=$4,
      record_date=$5,
      notes=$6,
      employee_name=$7,
      employee_amount=$8
    WHERE finance_id=$9
  `;

  try {
    await db.query(sql, [
      type,
      category,
      property_name,
      amount,
      record_date,
      notes,
      employee_name || null,
      employee_amount || null,
      req.params.id
    ]);

    res.json({ message: "Finance updated" });
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


// delete finance record
app.delete("/api/finance/:id", async (req, res) => {
  const financeId = req.params.id;

  try {
    const result = await db.query(
      "DELETE FROM finances WHERE finance_id=$1",
      [financeId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Finance record not found" });
    }

    res.json({ message: "Finance record deleted successfully" });
  } catch (err) {
    console.error("❌ Delete finance error:", err);
    res.status(500).json({ message: "DB Error" });
  }
});




// ⭐ GET MATCHED PROPERTIES FOR CUSTOMER (PRIORITY BASED)
// ⭐ GET MATCHED PROPERTIES FOR CUSTOMER (NO PRIORITY)
// ⭐ GET MATCHED PROPERTIES FOR CUSTOMER (SMART MATCHING)
// ⭐ GET MATCHED PROPERTIES FOR CUSTOMER (WITH MATCH REASONS)
//GET MATCHED PROPERTIES FOR CUSTOMER
app.get("/api/customers/:id/matched-properties", async (req, res) => {
  const { id } = req.params;

  try {
    const customerResult = await db.query(
      `
      SELECT 
        budget_min,
        budget_max,
        LOWER(preferred_location) AS preferred_location,
        LOWER(property_type) AS property_type,
        LOWER(requirement_details) AS requirement_details
      FROM customers
      WHERE customer_id=$1
      `,
      [id]
    );

    if (!customerResult.rows.length) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const {
      budget_min,
      budget_max,
      preferred_location,
      property_type,
      requirement_details
    } = customerResult.rows[0];

    const propertySql = `
      SELECT 
        p.property_id,
        p.property_name AS title,
        p.property_type,
        p.price,
        p.area_value,
        p.area_unit,
        p.mandal,
        p.district,
        p.address,
        p.availability,

        CASE WHEN LOWER(p.mandal) = $1 THEN 1 ELSE 0 END AS mandal_match,
        CASE WHEN LOWER(p.district) = $2 THEN 1 ELSE 0 END AS district_match,
        CASE WHEN LOWER(p.property_type) = $3 THEN 1 ELSE 0 END AS type_match,
        CASE WHEN p.price BETWEEN $4 AND $5 THEN 1 ELSE 0 END AS budget_match,
        CASE 
          WHEN LOWER(p.address) LIKE '%' || $6 || '%'
          THEN 1 ELSE 0 
        END AS address_match

      FROM properties p
      WHERE 
        LOWER(p.availability::text)  = 'available'
        AND (
          LOWER(p.mandal) = $7
          OR LOWER(p.district) = $8
          OR LOWER(p.address) LIKE '%' || $9 || '%'
          OR p.price BETWEEN $10 AND $11
          OR LOWER(p.property_type) = $12
        )
      ORDER BY p.property_id DESC
    `;

    const params = [
      preferred_location,
      preferred_location,
      property_type,
      budget_min,
      budget_max,
      preferred_location,

      preferred_location,
      preferred_location,
      preferred_location,
      budget_min,
      budget_max,
      property_type
    ];

    const properties = await db.query(propertySql, params);
    res.json(properties.rows);
  } catch (err) {
    console.error("❌ Property match failed:", err);
    res.status(500).json({ message: "Property match failed" });
  }
});





// ⭐ GET ALL CUSTOMERS WITH MATCH COUNT
// ⭐ GET CUSTOMERS WITH MATCHED PROPERTIES COUNT
// ⭐ GET CUSTOMERS WITH MATCHED PROPERTIES COUNT + MATCH FLAG
app.get("/api/customers-with-matches", async (req, res) => {
 const sql = `
  SELECT 
    c.customer_id,
    c.name,
    c.email,
    c.phone,
    c.budget_min,
    c.budget_max,
    c.preferred_location,
    c.property_type,
    c.requirement_details,
    c.lead_status,
    c.created_at,

    (
      SELECT COUNT(*)
      FROM properties p
      WHERE 
        LOWER(p.availability::text) = 'available'
        AND (
          LOWER(p.mandal) = LOWER(c.preferred_location)
          OR LOWER(p.district) = LOWER(c.preferred_location)
          OR LOWER(p.address) LIKE '%' || LOWER(c.preferred_location) || '%'
          OR p.price BETWEEN c.budget_min AND c.budget_max
          OR LOWER(p.property_type) = LOWER(c.property_type)
        )
    ) AS matched_properties_count

  FROM customers c
  ORDER BY c.customer_id DESC
`;


  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    res.status(500).json({ message: "Database fetch error" });
  }
});


//DASHBOARD COUNTS (customers, properties, income, expenses, profit)
// customers, properties, income, expenses, profit
app.get("/api/dashboard-counts", async (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers_count,
      (SELECT COUNT(*) FROM properties) AS properties_count,

      (
        SELECT COALESCE(SUM(amount), 0)
        FROM finances
        WHERE type = 'Income'
          AND record_date >= date_trunc('month', CURRENT_DATE)
          AND record_date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      ) AS monthly_income,

      (
        SELECT COALESCE(SUM(amount), 0)
        FROM finances
        WHERE type = 'Expense'
          AND record_date >= date_trunc('month', CURRENT_DATE)
          AND record_date <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
      ) AS monthly_expenses
  `;

  try {
    const result = await db.query(sql);

    const data = result.rows[0];
    data.net_profit = data.monthly_income - data.monthly_expenses;

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


// Today's follow-ups
app.get("/api/todays-followups-count", async (req, res) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM followups
    WHERE next_followup_at::date = CURRENT_DATE
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});

//THIS MONTH’S SITE VISITS COUNT
// This month's site visits
app.get("/api/monthly-site-visits-count", async (req, res) => {
  const sql = `
    SELECT COUNT(*) AS count
    FROM site_visits
    WHERE visit_datetime >= date_trunc('month', CURRENT_DATE)
      AND visit_datetime <  date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});


// Get employees (users with USER role)
app.get("/api/employees", async (req, res) => {
  const sql = `
    SELECT user_id, name
    FROM users
    WHERE role = 'USER'
      AND is_active = true
  `;

  try {
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "DB Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
