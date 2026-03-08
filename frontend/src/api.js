/**
 * SnapSight AI - API Service
 * Handles all communication with the FastAPI backend.
 */

const API_BASE = "http://localhost:8000";

export async function askQuestion(question) {
  try {
    const response = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.error || "Failed to get answer");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function getSuggestions() {
  try {
    const response = await fetch(`${API_BASE}/api/suggestions`);
    const data = await response.json();
    return data.suggestions;
  } catch (error) {
    console.error("Failed to load suggestions:", error);
    return [
      "Show me revenue by product category",
      "What is our profit trend this year?",
      "Compare regional performance by quarter",
      "How is customer retention trending?",
      "Show me the sales pipeline funnel",
    ];
  }
}

export async function discoverInsights() {
  try {
    const response = await fetch(`${API_BASE}/api/discover`, { method: "POST" });
    if (!response.ok) throw new Error("Discovery failed");
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("SpotIQ Error:", error);
    throw error;
  }
}

export async function askCsv(question, data, columns) {
  try {
    const response = await fetch(`${API_BASE}/api/ask-csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, data, columns }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.error || "Failed to analyze CSV");
    }
    return await response.json();
  } catch (error) {
    console.error("CSV API Error:", error);
    throw error;
  }
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch (error) {
    return { status: "error", database: "disconnected", message: "API unreachable" };
  }
}
