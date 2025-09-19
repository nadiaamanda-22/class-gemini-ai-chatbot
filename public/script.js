const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");
const sendButton = form.querySelector('button[type="submit"]');

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Disable form while processing
  input.disabled = true;
  sendButton.disabled = true;

  appendMessage("user", userMessage);
  input.value = "";

  // Show a temporary "Thinking..." message
  const thinkingMessage = appendMessage("bot", "Thinking...");

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Match backend expectation
        conversation: [{ role: "user", message: userMessage }],
      }),
    });

    if (!response.ok) {
      console.error("Server error:", response.status, response.statusText);
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // Match backend response: { success: true, data: "...", message: null }
    if (data && data.success && data.data) {
      thinkingMessage.textContent = data.data;
    } else {
      // Use the error message from the backend if available
      const errorMessage = data.message || "Sorry, no valid response received.";
      thinkingMessage.textContent = `⚠️ ${errorMessage}`;
    }
  } catch (error) {
    console.error("Error:", error);
    thinkingMessage.textContent = "⚠️ Gagal mendapatkan respons dari server.";
    thinkingMessage.classList.add("error");
  } finally {
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
  }
});

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}
