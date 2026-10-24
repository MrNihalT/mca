import React, { useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export default function App() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);
    setError("");
    if (!body.trim()) {
      setError("Please paste the email body first.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Could not classify this email.");
      }
      setResult(data);
    } catch (err) {
      setError(`${err.message}. Make sure the FastAPI server is running and the model has been trained.`);
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setSubject("");
    setBody("");
    setResult(null);
    setError("");
  }

  const isSpam = result?.prediction === "spam";

  return (
    <main className="page">
      <nav className="nav">
        <a className="brand" href="#"><span className="brand-icon">M</span> MailGuard</a>
        <span className="nav-label"><span className="live-dot" /> ML-powered email check</span>
      </nav>

      <section className="hero">
        <div className="eyebrow"><span>✳</span> SMART INBOX SECURITY</div>
        <h1>Know what’s in your <span>inbox.</span></h1>
        <p className="subtitle">Paste an email. Let a machine learning model check whether it looks like spam or a legitimate message.</p>
      </section>

      <section className="workspace">
        <form className="email-card" onSubmit={handleSubmit}>
          <div className="card-heading">
            <div><div className="overline">EMAIL ANALYZER</div><h2>Inspect a message</h2></div>
            <div className="mail-symbol">✉</div>
          </div>
          <label htmlFor="subject">Subject <span className="optional">OPTIONAL</span></label>
          <input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
            maxLength={500} placeholder="e.g. Your account needs attention" />
          <label htmlFor="body">Email body</label>
          <textarea id="body" value={body} onChange={(e) => setBody(e.target.value)}
            maxLength={30000} rows={9} placeholder="Paste the full email text here..." />
          <div className="form-foot"><span>{body.length.toLocaleString()} / 30,000 characters</span><button className="clear" type="button" onClick={clearForm}>Clear</button></div>
          <button className="submit" type="submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Analyzing…</> : <>Analyze email <span>↗</span></>}
          </button>
          {error && <div className="error" role="alert">{error}</div>}
          <p className="privacy-note">⌑ Your text is sent to this project's API for analysis. Don't paste private or confidential emails.</p>
        </form>

        <aside className="result-panel">
          <div className="result-top"><span className="overline">ANALYSIS RESULT</span><span className="spark">✳</span></div>
          {!result ? (
            <div className="empty-state">
              <div className="empty-art"><div className="art-envelope">✉</div><span className="orbit orbit-one">?</span><span className="orbit orbit-two">✳</span></div>
              <h3>Your result appears here</h3>
              <p>Enter an email on the left to see the model’s prediction and spam probability.</p>
              <div className="mini-steps"><div><span>01</span> Paste email</div><div><span>02</span> Run analysis</div><div><span>03</span> Review result</div></div>
            </div>
          ) : (
            <div className="prediction">
              <div className={`result-icon ${isSpam ? "spam" : "ham"}`}>{isSpam ? "!" : "✓"}</div>
              <div className={`result-pill ${isSpam ? "spam" : "ham"}`}>{isSpam ? "POTENTIAL SPAM" : "LIKELY LEGITIMATE"}</div>
              <h3>{isSpam ? "This looks like spam." : "This looks like a normal email."}</h3>
              <p>{result.message}. This is a model prediction, not a guarantee.</p>
              {result.spam_probability !== null && result.spam_probability !== undefined && (
                <div className="probability">
                  <div className="prob-label"><span>Spam probability</span><strong>{Math.round(result.spam_probability * 100)}%</strong></div>
                  <div className="bar"><div style={{ width: `${Math.max(0, Math.min(100, result.spam_probability * 100))}%` }} /></div>
                  <small>Estimated by the trained classifier</small>
                </div>
              )}
              <button type="button" className="try-again" onClick={clearForm}>Check another email ↗</button>
            </div>
          )}
          <div className="disclaimer">MODEL NOTE <p>Predictions depend on the dataset and training quality. Always verify suspicious links and sender addresses independently.</p></div>
        </aside>
      </section>
      <footer><span>MAILGUARD <span className="footer-dot">•</span> MACHINE LEARNING PROJECT</span><span>Built with React + FastAPI + scikit-learn</span></footer>
    </main>
  );
}
