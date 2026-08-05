import { Router } from "express";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, BUCKET } from "../lib/storage";
import { pool } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";
import express from "express";

const router = Router();

// Accept raw encrypted bytes from the client
router.put("/backup", requireAuth, express.raw({ type: "*/*", limit: "50mb" }), async (req: AuthedRequest, res) => {
  try {
    const key = `backups/${req.userId}/${Date.now()}.enc`;

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: req.body,
      })
    );

    await pool.query(
      "INSERT INTO backup_blobs (user_id, storage_key, size_bytes) VALUES ($1, $2, $3)",
      [req.userId, key, req.body.length]
    );

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backup upload failed" });
  }
});

// Fetch the most recent backup for restore-on-new-device
router.get("/backup/latest", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT storage_key FROM backup_blobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No backup found" });
    }

    const key = result.rows[0].storage_key;
    const object = await r2.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

    res.setHeader("Content-Type", "application/octet-stream");
    // @ts-ignore - Body is a readable stream in Node
    object.Body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Backup fetch failed" });
  }
});

// Delete all cloud data for the user
router.delete("/account/data", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT storage_key FROM backup_blobs WHERE user_id = $1",
      [req.userId]
    );

    for (const row of result.rows) {
      await r2.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: row.storage_key }));
    }

    await pool.query("DELETE FROM backup_blobs WHERE user_id = $1", [req.userId]);

    res.sendStatus(204);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Data deletion failed" });
  }
});

export default router;