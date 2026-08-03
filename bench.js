// ============================================================
// Web Search API Bench Script
//
// Tests Exa, Keiro, Parallel, Tavily, and Valyu raw APIs with
// the same fixed set of queries, measures latency, and reports
// success/failure for each — an automated version of the manual
// testing behind the accompanying benchmark report.
//
// SCOPE: this tests each provider's core SEARCH function only.
// Not all providers expose a comparable "answer" or "research"
// feature (Keiro does, via keiro_answer/keiro_research; the
// others are primarily search+extract), so a fair, apples-to-
// apples test across all 5 is only possible on search. The
// Keiro answer/research/crawl findings in the report were from
// separate manual testing, not this script.
//
// Run with: node bench.js
// Requires Node 18+ (built-in fetch)
//
// NOTE: the Parallel and Valyu endpoint shapes below are best-
// effort reconstructions — verify against their current docs
// before relying on this for anything beyond a rough check, since
// those two were originally tested via Hermes/MCP, not raw curl,
// unlike Keiro/Tavily/Exa which were confirmed directly.
// ============================================================

const QUERIES = [
  'what is kubernetes',
  'who is the current CEO of OpenAI',
  'explain the difference between REST and GraphQL APIs',
  'best way to learn programming',
  'is coffee good or bad for you',
];

// Fill in your own API keys before running
const KEYS = {
  keiro: process.env.KEIRO_API_KEY || 'YOUR_KEIRO_KEY',
  tavily: process.env.TAVILY_API_KEY || 'YOUR_TAVILY_KEY',
  exa: process.env.EXA_API_KEY || 'YOUR_EXA_KEY',
  parallel: process.env.PARALLEL_API_KEY || 'YOUR_PARALLEL_KEY',
  valyu: process.env.VALYU_API_KEY || 'YOUR_VALYU_KEY',
};

const PROVIDERS = {
  exa: {
    call: async (query) => {
      const res = await fetch('https://api.exa.ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': KEYS.exa },
        body: JSON.stringify({ query, numResults: 3 }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status}: ${body.slice(0,150)}`); }
      return true;
    },
  },
  keiro: {
    call: async (query) => {
      const res = await fetch('https://kierolabs.space/api/v2/search/fast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KEYS.keiro}` },
        body: JSON.stringify({ query, maxResults: 3 }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status}: ${body.slice(0,150)}`); }
      return true;
    },
  },
  parallel: {
    call: async (query) => {
      const res = await fetch('https://api.parallel.ai/v1beta/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': KEYS.parallel },
        body: JSON.stringify({ objective: query, search_queries: [query] }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status}: ${body.slice(0,150)}`); }
      return true;
    },
  },
  tavily: {
    call: async (query) => {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: KEYS.tavily, query, max_results: 3 }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status}: ${body.slice(0,150)}`); }
      return true;
    },
  },
  valyu: {
    call: async (query) => {
      const res = await fetch('https://api.valyu.network/v1/deepsearch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': KEYS.valyu },
        body: JSON.stringify({ query, max_num_results: 3 }),
      });
      if (!res.ok) { const body = await res.text().catch(() => ''); throw new Error(`HTTP ${res.status}: ${body.slice(0,150)}`); }
      return true;
    },
  },
};

async function testProvider(name, provider) {
  const results = [];
  for (const query of QUERIES) {
    const start = Date.now();
    let success = false;
    let error = null;
    try {
      const res = await provider.call(query);
      success = res;
      if (!success) error = 'Non-OK response';
    } catch (err) {
      success = false;
      error = err.message;
    }
    const latencyMs = Date.now() - start;
    results.push({ query, success, latencyMs, error });
  }
  const successCount = results.filter(r => r.success).length;
  const avgLatency = Math.round(results.reduce((a, r) => a + r.latencyMs, 0) / results.length);
  const errors = [...new Set(results.filter(r => r.error).map(r => r.error))];
  return { name, successRate: `${successCount}/${results.length}`, avgLatencyMs: avgLatency, errors, results };
}

async function main() {
  console.log('Running bench across all 5 providers (alphabetical order, no priority)...\n');
  const names = Object.keys(PROVIDERS).sort();
  const summary = [];

  for (const name of names) {
    process.stdout.write(`Testing ${name}... `);
    const result = await testProvider(name, PROVIDERS[name]);
    summary.push(result);
    console.log(`done — ${result.successRate} success, avg ${result.avgLatencyMs}ms`);
    if (result.errors.length > 0) {
      console.log(`  Errors seen: ${result.errors.join('; ')}`);
    }
  }

  console.log('\n--- Summary Table ---');
  console.table(summary.map(s => ({
    Provider: s.name,
    'Success Rate': s.successRate,
    'Avg Latency (ms)': s.avgLatencyMs,
  })));
}

main();
