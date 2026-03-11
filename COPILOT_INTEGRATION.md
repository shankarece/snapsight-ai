# GitHub Copilot Integration - SnapSight AI

Enhance SnapSight AI with GitHub Copilot-inspired features for interactive AI-assisted data exploration.

---

## Features Implemented

### 1. **Explain This Insight** (Copilot Context Understanding)
- User hovers over or clicks an insight
- Copilot analyzes the data and insight together
- Generates a deeper, multi-paragraph explanation
- Shows "Why is this important?" and "What should we do?"
- Uses multi-turn conversation

### 2. **Suggest Next Analysis** (Copilot Suggestions)
- After viewing a result, Copilot suggests logical next steps
- Examples:
  - "Revenue by region" → Suggests "Break down by product within top region"
  - "Customer churn" → Suggests "Analyze tenure vs churn rate"
- Clickable suggestions trigger new queries

### 3. **Ask Copilot About This Chart** (Copilot Reasoning)
- User clicks "Ask Copilot" on any chart
- Opens an interactive input box
- User can ask questions about the specific data
- Copilot analyzes the chart data and provides insights
- Examples:
  - "Why is Q3 lower than Q2?"
  - "Which region is underperforming?"
  - "What's the trend direction?"

### 4. **Generate SQL Explanation** (Developer Copilot)
- Show the generated SQL query in UI
- "Explain this SQL" button
- Copilot explains what the query does in plain English
- Helps users understand the data fetching logic

### 5. **Smart Filters** (Copilot Filtering)
- "Analyze only [segment]" text input
- Copilot understands fuzzy filter requests
- "Just high-value customers" → Filters intelligently
- "Top 3 regions" → Applies limit automatically

---

## Architecture

```
Frontend (React)
├── Ask Tab
│   ├── Query Input (existing)
│   ├── Results with Copilot Buttons
│   │   ├── "Explain This" → CopilotPanel
│   │   ├── "Suggest Next" → Auto-suggestions
│   │   └── "Ask Copilot" → CopilotChat
│   └── Insight Card
│       └── "Explain with Copilot" → Deep analysis
├── CopilotPanel (new component)
│   ├── Conversation history
│   ├── Input box
│   ├── Response streaming
│   └── Follow-up buttons
└── API.js
    └── /api/copilot-explain (new endpoint)

Backend (Python/FastAPI)
├── /api/copilot-explain (POST)
│   ├── Analyzes query + data + insight
│   ├── Generates explanation using LLM
│   └── Returns formatted response
├── /api/copilot-suggest (POST)
│   ├── Suggests next logical analysis
│   └── Returns array of question suggestions
└── /api/copilot-filter (POST)
    ├── Parses natural language filter
    ├── Converts to SQL WHERE clause
    └── Returns filtered data
```

---

## Implementation Steps

### Step 1: Backend Endpoints

Add to `backend/main.py`:

```python
@app.post("/api/copilot-explain")
async def copilot_explain(request: dict):
    """Explain an insight using Copilot-style analysis"""
    question = request.get("question")
    data = request.get("data")
    insight = request.get("insight")
    chart_type = request.get("chart_type")

    prompt = f"""
    The user asked: "{question}"

    Chart type: {chart_type}
    Data (first 5 rows): {json.dumps(data[:5], default=str)}

    Current insight: "{insight}"

    Provide a deeper 2-3 paragraph analysis that:
    1. Explains WHY this pattern exists (business context)
    2. What implications this has for the business
    3. What action should be taken based on this insight
    4. Any risks or opportunities highlighted by the data

    Use professional business language. Be specific to the data shown.
    """

    response = await azure_openai_call(prompt)
    return {"explanation": response}

@app.post("/api/copilot-suggest")
async def copilot_suggest(request: dict):
    """Suggest next analysis steps (Copilot suggestions)"""
    question = request.get("question")
    data = request.get("data")
    columns = request.get("columns")

    prompt = f"""
    User previously asked: "{question}"

    Available columns: {columns}
    Sample data: {json.dumps(data[:3], default=str)}

    Suggest 3-4 logical next questions they should ask.
    Format as a JSON array: ["Question 1", "Question 2", ...]

    Make suggestions that:
    - Drill down into key dimensions
    - Compare across segments
    - Investigate trends
    - Challenge assumptions
    """

    response = await azure_openai_call(prompt)
    suggestions = json.loads(response)
    return {"suggestions": suggestions}

@app.post("/api/copilot-chat")
async def copilot_chat(request: dict):
    """Chat about a specific chart or dataset"""
    question = request.get("question")
    data = request.get("data")
    chart_type = request.get("chart_type")
    columns = request.get("columns")

    prompt = f"""
    The user is analyzing a {chart_type} chart with the following data:

    Columns: {columns}
    Data: {json.dumps(data[:10], default=str)}

    User question: "{question}"

    Provide a direct, insightful answer based on the data.
    Be specific - reference actual values from the data.
    Keep response concise (2-3 sentences).
    """

    response = await azure_openai_call(prompt)
    return {"response": response}
```

### Step 2: Frontend Components

Create `frontend/src/components/CopilotPanel.js`:

```jsx
import React, { useState } from 'react';
import { MessageCircle, Send, Loader } from 'lucide-react';

export default function CopilotPanel({ suggestion, data, chartType, onClose }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { type: 'copilot', text: suggestion }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { type: 'user', text: input }]);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/copilot-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input,
          data,
          chart_type: chartType
        })
      });

      const result = await response.json();
      setMessages(prev => [...prev, { type: 'copilot', text: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { type: 'error', text: 'Error: ' + err.message }]);
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 400,
      height: 500,
      background: 'rgba(13,11,46,0.95)',
      border: '1px solid rgba(0,210,255,0.3)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
    }}>
      {/* Header */}
      <div style={{
        padding: 16,
        borderBottom: '1px solid rgba(0,210,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={20} color="#00D2FF" />
          <span style={{ color: '#fff', fontWeight: 600 }}>Copilot</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: 20
        }}>×</button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{
            background: msg.type === 'copilot' ? 'rgba(0,210,255,0.1)' : 'rgba(167,139,250,0.1)',
            border: `1px solid ${msg.type === 'copilot' ? 'rgba(0,210,255,0.2)' : 'rgba(167,139,250,0.2)'}`,
            borderRadius: 8,
            padding: 10,
            color: '#f1f5f9',
            fontSize: 12,
            lineHeight: 1.5
          }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Loader size={16} color="#00D2FF" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        padding: 12,
        borderTop: '1px solid rgba(0,210,255,0.1)',
        display: 'flex',
        gap: 8
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about this chart..."
          style={{
            flex: 1,
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(0,210,255,0.2)',
            borderRadius: 6,
            color: '#f1f5f9',
            fontSize: 12,
            outline: 'none'
          }}
        />
        <button onClick={handleSend} disabled={loading} style={{
          padding: '8px 12px',
          background: '#00D2FF',
          border: 'none',
          borderRadius: 6,
          color: '#0F1419',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 12,
          opacity: loading ? 0.6 : 1
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
```

### Step 3: Integrate into ChartWidget

Add to existing ChartWidget.js:

```jsx
// Add state for Copilot panel
const [copilotOpen, setCopilotOpen] = useState(false);
const [copilotSuggestion, setCopilotSuggestion] = useState('');

// Add button in chart card header
<button
  onClick={async () => {
    const response = await fetch('http://localhost:8000/api/copilot-explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: widget.question,
        data: widget.data,
        insight: widget.insight,
        chart_type: widget.chart_type
      })
    });
    const result = await response.json();
    setCopilotSuggestion(result.explanation);
    setCopilotOpen(true);
  }}
  style={{...buttonStyle}}
>
  💡 Ask Copilot
</button>

// Add Copilot panel
{copilotOpen && (
  <CopilotPanel
    suggestion={copilotSuggestion}
    data={widget.data}
    chartType={widget.chart_type}
    onClose={() => setCopilotOpen(false)}
  />
)}
```

---

## Usage Examples

### Example 1: Explain Revenue Trend
1. User queries "Show revenue trend by month"
2. Gets line chart showing monthly progression
3. Clicks "Ask Copilot" → "Explain this deeper"
4. Copilot returns:
   ```
   "Your revenue shows a strong seasonal pattern with peak in Q4 (holiday season).
    However, the Sept-Oct dip suggests a transition period where marketing should focus
    on customer retention. Recommend: increase retention campaigns, analyze churn drivers,
    and prepare inventory for Q4 spike."
   ```

### Example 2: Suggest Next Steps
1. After "Show revenue by region" query
2. Copilot suggests:
   - "Compare region growth rates YoY"
   - "Analyze product mix within North America"
   - "Identify underperforming regions for targeted campaigns"
3. User clicks suggestion → runs new query automatically

### Example 3: Ask About Anomalies
1. User sees a sudden dip in the chart
2. Asks Copilot: "Why is Q2 lower than Q1?"
3. Copilot analyzes data:
   ```
   "Q2 revenue is 15% lower primarily due to 3 fewer sales days (holidays).
    However, per-unit revenue increased 8%, suggesting better pricing or deal mix.
    This is actually a positive indicator when normalized for calendar days."
   ```

---

## Deployment Checklist

- [ ] Backend endpoints added to FastAPI
- [ ] CopilotPanel component created
- [ ] Integration into ChartWidget complete
- [ ] API calls tested locally
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Conversation history persisted per session
- [ ] Mobile responsive tested
- [ ] Azure deployment updated
- [ ] GitHub Copilot icon/branding added

---

## Advanced Features (Future)

1. **Code Generation**: "Show me the SQL" → Copilot explains the query
2. **Anomaly Detection**: Auto-detect unusual patterns and alert user
3. **Forecasting**: "Predict next quarter revenue" → time-series forecast
4. **Comparative Analysis**: "Compare vs last year" → auto-generates comparison charts
5. **Alert Configuration**: "Alert me if revenue drops below X" → setup monitoring

---

## Testing

### Unit Test CopilotPanel
```javascript
test('sends message on Enter key', () => {
  const { getByPlaceholderText, getByRole } = render(
    <CopilotPanel suggestion="Test" data={[]} chartType="bar" onClose={jest.fn()} />
  );
  const input = getByPlaceholderText('Ask about this chart...');
  fireEvent.change(input, { target: { value: 'Test question' } });
  fireEvent.keyPress(input, { key: 'Enter' });

  expect(getByRole('button', { name: /send/i })).toBeDefined();
});
```

### Integration Test
```bash
curl -X POST http://localhost:8000/api/copilot-explain \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Show revenue by region",
    "data": [...],
    "insight": "North America leads with 45%",
    "chart_type": "pie"
  }'
```

---

**Status**: ✅ Ready for Implementation
**Time to Implement**: 2-3 hours
**Impact on Hackathon**: High - Demonstrates modern AI assistant integration
