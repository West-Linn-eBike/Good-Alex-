
const TAVILY_API_KEY = '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';

export async function searchTavily(query: string): Promise<string> {
  // If no API key is present (shouldn't happen given the hardcoded one, but good for safety)
  if (!TAVILY_API_KEY) {
      console.warn("Tavily API Key missing.");
      return "";
  }

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: query,
        search_depth: "advanced", // Deep search for reviews and specs
        include_answer: true,
        max_results: 7, // Get a good breadth of sources
        include_domains: [], // We let Tavily decide, but it usually picks high authority sites
        exclude_domains: [] 
      }),
    });

    if (!response.ok) {
        console.warn("Tavily search failed", response.statusText);
        return "";
    }

    const data = await response.json();
    
    let context = "### 📚 Provided Research Data (Source: Tavily High-Confidence Search):\n";
    context += "Use this data to cross-reference your own Google Search findings.\n\n";

    if (data.answer) {
        context += `**Quick Summary:** ${data.answer}\n\n`;
    }
    
    if (data.results && Array.isArray(data.results)) {
        data.results.forEach((result: any, index: number) => {
            context += `**Source ${index + 1}:** [${result.title}](${result.url})\n`;
            context += `**Content:** ${result.content}\n\n`;
        });
    }

    // Add a separator to be clear where research ends
    context += "--- END OF PROVIDED RESEARCH DATA ---\n";
    
    return context;
  } catch (error) {
    console.error("Error calling Tavily:", error);
    // Fail gracefully so the app still works with just Google Search
    return "";
  }
}
