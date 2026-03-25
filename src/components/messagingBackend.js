const express = require("express");
const webpush = require("web-push");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);



// Sends push notification to a list of subscriptions
async function sendPushToSubscriptions(subscriptions, payload) {
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify(payload),
      ),
    ),
  );

  // Clean up expired subscriptions
  const expired = results
    .map((result, i) => ({ result, sub: subscriptions[i] }))
    .filter(
      ({ result }) =>
        result.status === "rejected" && result.reason?.statusCode === 410,
    );

  if (expired.length > 0) {
    await supabase
      .from("subscriptions")
      .delete()
      .in(
        "endpoint",
        expired.map(({ sub }) => sub.endpoint),
      );
  }

  return results.filter((r) => r.status === "fulfilled").length;
}

// Logs the message to the messages table
async function logMessage(senderId, recipientId, groupId, title, body, type) {
  await supabase.from("messages").insert({
    sender_id: senderId,
    recipient_id: recipientId || null,
    group_id: groupId || null,
    title,
    body,
    type,
  });
}

// ─────────────────────────────────────────
// SUBSCRIPTION ROUTES
// ─────────────────────────────────────────

// Save a new push subscription
app.post("/subscribe", async (req, res) => {
  const { endpoint, keys, user_id, group_id } = req.body;

  const { error } = await supabase
    .from("subscriptions")
    .insert({ endpoint, keys, user_id, group_id });

  if (error) return res.status(500).json({ error: error.message });

  res.status(201).json({ message: "Subscribed successfully" });
});

// ─────────────────────────────────────────
// MESSAGING ROUTES
// ─────────────────────────────────────────

// Send to an individual user
app.post("/notify/user/:userId", async (req, res) => {
  const { userId } = req.params;
  const { title, body, senderId } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  // Fetch subscriptions for this user
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (error) return res.status(500).json({ error: error.message });
  if (!subscriptions.length) {
    return res
      .status(404)
      .json({ error: "No subscriptions found for this user" });
  }

  // Send the push notification
  const sent = await sendPushToSubscriptions(subscriptions, { title, body });

  // Log it to the messages table
  await logMessage(senderId, userId, null, title, body, "individual");

  res.json({ sent, recipient: userId });
});

// Send to a group
app.post("/notify/group/:groupId", async (req, res) => {
  const { groupId } = req.params;
  const { title, body, senderId } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  // Fetch all subscriptions in this group
  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("group_id", groupId);

  if (error) return res.status(500).json({ error: error.message });
  if (!subscriptions.length) {
    return res
      .status(404)
      .json({ error: "No subscriptions found for this group" });
  }

  const sent = await sendPushToSubscriptions(subscriptions, { title, body });

  await logMessage(senderId, null, groupId, title, body, "group");

  res.json({ sent, group: groupId });
});

// Broadcast to everyone
app.post("/notify/all", async (req, res) => {
  const { title, body, senderId } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: "Title and body are required" });
  }

  const { data: subscriptions, error } = await supabase
    .from("subscriptions")
    .select("*");

  if (error) return res.status(500).json({ error: error.message });

  const sent = await sendPushToSubscriptions(subscriptions, { title, body });

  await logMessage(senderId, null, null, title, body, "broadcast");

  res.json({ sent });
});

// ─────────────────────────────────────────
// HISTORY ROUTES
// ─────────────────────────────────────────

// Get all messages sent to a specific user
app.get("/messages/user/:userId", async (req, res) => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("recipient_id", userId)
    .order("sent_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// Get all messages sent to a group
app.get("/messages/group/:groupId", async (req, res) => {
  const { groupId } = req.params;

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("group_id", groupId)
    .order("sent_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// Get all messages ever sent (admin view)
app.get("/messages/all", async (req, res) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("sent_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});


// Get all users (for populating dropdowns in the UI)
app.get("/users", async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, group_id");

  if (error) return res.status(500).json({ error: error.message });

  res.json(data);
});

// Get all groups
app.get("/groups", async (req, res) => {
  const { data, error } = await supabase.from("users").select("group_id");

  if (error) return res.status(500).json({ error: error.message });

  // Return unique group names
  const groups = [...new Set(data.map((u) => u.group_id))];
  res.json(groups);
});

// ─────────────────────────────────────────

app.listen(3000, () => console.log("Server running on port 3000"));
