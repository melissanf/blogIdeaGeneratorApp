/** @jsxImportSource https://esm.sh/react@18.2.0 */
import React, { useState, useCallback, useEffect } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";

// CSS definition moved up to be accessible in server function
const css = `
body { 
  margin: 0; 
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
}
button:disabled { 
  opacity: 0.5;
  cursor: not-allowed; 
}
* {
  box-sizing: border-box;
}
`;

function App() {
  const [topic, setTopic] = useState("");
  const [ideas, setIdeas] = useState<string[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [outline, setOutline] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'ideas' | 'outline' | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setError("Please enter a blog topic");
      return;
    }

    setIsLoading(true);
    setIdeas([]);
    setError(null);
    setShareLink(null);

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: trimmedTopic, type: "ideas" }),
      });
      const data = await response.json();
      setIdeas(data.ideas);
    } catch (error) {
      console.error("Error generating ideas:", error);
      setError("Failed to generate blog ideas. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateOutline = async (idea: string) => {
    setSelectedIdea(idea);
    setIsLoading(true);
    setOutline([]);
    setShareLink(null);

    try {
      const response = await fetch("/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea, type: "outline" }),
      });
      const data = await response.json();
      setOutline(data.outline);
    } catch (error) {
      console.error("Error generating outline:", error);
      setError("Failed to generate blog outline. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = useCallback((content: string[], type: 'ideas' | 'outline') => {
    const textToCopy = content.join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    });
  }, []);

  const generateShareLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/generate-share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          topic, 
          ideas, 
          selectedIdea, 
          outline 
        }),
      });
      const data = await response.json();
      
      const fullShareLink = `${window.location.origin}/share-${data.shareId}`;
      setShareLink(fullShareLink);
      
      // Automatically copy to clipboard
      navigator.clipboard.writeText(fullShareLink);
    } catch (error) {
      console.error("Error generating share link:", error);
      setError("Failed to generate share link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>✍️ Blog Idea Generator</h1>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setError(null);
            }}
            placeholder="Enter your blog topic"
            style={{
              ...styles.input,
              ...(error ? styles.inputError : {})
            }}
          />
          <button 
            type="submit" 
            style={styles.button} 
            disabled={isLoading || !topic.trim()}
          >
            {isLoading ? "Generating..." : "Generate"}
          </button>
        </form>

        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {ideas.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Blog Post Ideas</h2>
              <div style={styles.actionButtons}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...(copiedType === 'ideas' ? styles.copiedButton : {})
                  }}
                  onClick={() => handleCopy(ideas, 'ideas')}
                >
                  {copiedType === 'ideas' ? '✅ Copied' : '📋 Copy'}
                </button>
                <button 
                  style={styles.actionButton}
                  onClick={generateShareLink}
                  disabled={isLoading}
                >
                  🔗 Share
                </button>
              </div>
            </div>
            <ul style={styles.list}>
              {ideas.map((idea, index) => (
                <li 
                  key={index} 
                  style={{
                    ...styles.listItem,
                    ...(selectedIdea === idea ? styles.selectedItem : {})
                  }}
                  onClick={() => generateOutline(idea)}
                >
                  {idea}
                </li>
              ))}
            </ul>
          </div>
        )}

        {outline.length > 0 && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Blog Post Outline</h2>
              <div style={styles.actionButtons}>
                <button 
                  style={{
                    ...styles.actionButton,
                    ...(copiedType === 'outline' ? styles.copiedButton : {})
                  }}
                  onClick={() => handleCopy(outline, 'outline')}
                >
                  {copiedType === 'outline' ? '✅ Copied' : '📋 Copy'}
                </button>
                <button 
                  style={styles.actionButton}
                  onClick={generateShareLink}
                  disabled={isLoading}
                >
                  🔗 Share
                </button>
              </div>
            </div>
            <ol style={styles.list}>
              {outline.map((section, index) => (
                <li key={index} style={styles.listItem}>
                  {section}
                </li>
              ))}
            </ol>
          </div>
        )}

        {shareLink && (
          <div style={styles.shareContainer}>
            <input 
              type="text" 
              value={shareLink} 
              readOnly 
              style={styles.shareInput}
            />
            <button 
              style={{
                ...styles.actionButton,
                ...(copiedType === 'share' ? styles.copiedButton : {})
              }}
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                setCopiedType('share');
                setTimeout(() => setCopiedType(null), 2000);
              }}
            >
              {copiedType === 'share' ? '✅ Copied' : '📋 Copy Link'}
            </button>
          </div>
        )}

        <footer style={styles.footer}>
          <a 
            href={import.meta.url.replace("esm.town", "val.town")} 
            target="_top" 
            style={styles.sourceLink}
          >
            View Source
          </a>
        </footer>
      </div>
    </div>
  );
}

function client() {
  createRoot(document.getElementById("root")).render(<App />);
}
if (typeof document !== "undefined") { client(); }

export default async function server(request: Request): Promise<Response> {
  // Handle API and shared content routes
  if (request.method === "POST") {
    const { OpenAI } = await import("https://esm.town/v/std/openai");
    const { blob } = await import("https://esm.town/v/std/blob");
    const openai = new OpenAI();

    const { topic, idea, type } = await request.json();

    // Additional server-side validation
    if (type === "ideas" && (!topic || topic.trim() === "")) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      let response;
      if (type === "ideas") {
        response = await openai.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: "You are a creative blog post idea generator. Generate 5 unique, engaging blog post ideas based on the given topic. Format each idea as a concise, compelling headline." 
            },
            { 
              role: "user", 
              content: `Generate blog post ideas for the topic: ${topic}` 
            }
          ],
          model: "gpt-4o-mini",
          max_tokens: 300,
        });

        const ideas = response.choices[0].message.content
          ?.split('\n')
          .filter(idea => idea.trim() !== '')
          .map(idea => idea.replace(/^\d+\.\s*/, '').trim()) || [];

        return new Response(JSON.stringify({ ideas }), {
          headers: { "Content-Type": "application/json" }
        });
      } else if (type === "outline") {
        response = await openai.chat.completions.create({
          messages: [
            { 
              role: "system", 
              content: "You are a professional blog post outline creator. Generate a detailed 5-6 section outline for the given blog post idea. Each section should have a clear, descriptive heading that captures the main point." 
            },
            { 
              role: "user", 
              content: `Create a blog post outline for this idea: ${idea}` 
            }
          ],
          model: "gpt-4o-mini",
          max_tokens: 300,
        });

        const outline = response.choices[0].message.content
          ?.split('\n')
          .filter(section => section.trim() !== '')
          .map(section => section.replace(/^\d+\.\s*/, '').trim()) || [];

        return new Response(JSON.stringify({ outline }), {
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "Invalid request type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to generate content" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Generate share link
  if (request.method === "POST" && request.url.includes("/generate-share")) {
    const { blob } = await import("https://esm.town/v/std/blob");
    const { topic, ideas, selectedIdea, outline } = await request.json();
    
    const shareId = Math.random().toString(36).substring(2, 15);
    
    try {
      await blob.setJSON(`share_${shareId}`, { 
        topic, 
        ideas, 
        selectedIdea, 
        outline 
      }, { 
        expiresIn: 7 * 24 * 60 * 60 
      });

      return new Response(JSON.stringify({ shareId }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to generate share link" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Retrieve shared content
  if (request.method === "GET" && request.url.includes("/shared/")) {
    const { blob } = await import("https://esm.town/v/std/blob");
    const shareId = new URL(request.url).pathname.split('/').pop();
    
    try {
      const sharedContent = await blob.getJSON(`share_${shareId}`);
      
      if (!sharedContent) {
        return new Response(JSON.stringify({ error: "Shared content not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(sharedContent), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to retrieve shared content" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Default response for GET requests
  return new Response(`
    <html>
      <head>
        <title>Blog Idea Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>${css}</style>
      </head>
      <body>
        <div id="root"></div>
        <script src="https://esm.town/v/std/catch"></script>
        <script type="module" src="${import.meta.url}"></script>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" }
  });
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f4f6f9',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  },
  content: {
    width: '100%',
    maxWidth: '600px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '30px',
  },
  title: {
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '25px',
    fontSize: '1.8em',
    fontWeight: '600',
  },
  form: {
    display: 'flex',
    marginBottom: '20px',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#e74c3c',
  },
  button: {
    padding: '12px 20px',
    fontSize: '16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  errorMessage: {
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#fff5f5',
    borderRadius: '8px',
  },
  section: {
    backgroundColor: '#f9fafa',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e9ecef',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '1.2em',
    color: '#2c3e50',
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    backgroundColor: '#2ecc71',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: '14px',
  },
  copiedButton: {
    backgroundColor: '#27ae60',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    margin: 0,
  },
  listItem: {
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    border: '1px solid transparent',
  },
  selectedItem: {
    backgroundColor: '#e9f5fd',
    borderColor: '#3498db',
  },
  shareContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px',
  },
  shareInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '12px',
  },
  sourceLink: {
    color: '#7f8c8d',
    textDecoration: 'none',
  }
};
