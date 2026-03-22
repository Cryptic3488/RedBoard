function showStatus(message, success = true) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `text-center text-sm font-medium py-3 px-4 rounded-lg ${
    success ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
  }`;
  status.classList.remove("hidden");
  setTimeout(() => status.classList.add("hidden"), 3000);
}

//individual messaging
async function sendToUser() {
  const userId = document.getElementById("userId").value;
  const title = document.getElementById("userTitle").value;
  const body = document.getElementById("userBody").value;

  if (!userId || !title || !body)
    return showStatus("Please fill in all fields", false);

  const res = await fetch(`/notify/user/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });

  const data = await res.json();
  showStatus(`✓ Sent to ${data.sent} device(s)`);
}

//group messaging
async function sendToGroup() {
  const groupId = document.getElementById("groupId").value;
  const title = document.getElementById("groupTitle").value;
  const body = document.getElementById("groupBody").value;

  if (!title || !body) return showStatus("Please fill in all fields", false);

  const res = await fetch(`/notify/group/${groupId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });

  const data = await res.json();
  showStatus(`✓ Sent to ${data.sent} device(s)`);
}

//universal messaging
async function sendToAll() {
  const title = document.getElementById("allTitle").value;
  const body = document.getElementById("allBody").value;

  if (!title || !body) return showStatus("Please fill in all fields", false);

  const res = await fetch("/notify/all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });

  const data = await res.json();
  showStatus(`✓ Sent to ${data.sent} device(s)`);
}
