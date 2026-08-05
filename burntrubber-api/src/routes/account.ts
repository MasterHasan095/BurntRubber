import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { pool } from "../db/pool";
import { requireAuth, AuthedRequest } from "../middleware/requireAuth";

const router = Router();

// Return the logged-in user's own profile
router.get("/account/me", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, provider, created_at FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// Change password (only applies to password-auth accounts, not OAuth-only)
router.patch("/account/password", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const result = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const { password_hash } = result.rows[0];

    if (!password_hash) {
      return res.status(400).json({ error: "This account uses OAuth sign-in and has no password to change" });
    }

    const valid = await bcrypt.compare(currentPassword, password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, req.userId]);

    res.sendStatus(204);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    console.error(err);
    res.status(500).json({ error: "Password update failed" });
  }
});

export default router;