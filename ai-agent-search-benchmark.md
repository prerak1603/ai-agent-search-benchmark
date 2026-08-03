# Benchmark Overview: Keiro vs Tavily vs Exa vs Parallel vs Valyu

Spent the last few days wiring up Keiro, Tavily, Exa, Parallel, and Valyu as tools inside Hermes Agent (open source agent from Nous Research, connects to APIs over MCP) and running the same set of questions through all five. Wanted actual numbers instead of just going off vibes.

Tested two things for each: hitting the API directly (raw), and calling it through the agent, since that's how most people actually end up using these day to day.

## Dashboard

![Summary Dashboard](dashboard_summary.png)

## Quick summary table

| Provider | Tools | Agent Search Success | Agent Latency | Answer Quality |
|---|---|---|---|---|
| Keiro | 6 (general search/research) | 100% | ~5.5s | Excellent |
| Tavily | 2 | 82% | ~2-3s | Solid, well-cited |
| Exa | 2 | 100%* | ~2.4s | Excellent |
| Parallel | 2 | 100%* | ~1.4s | Excellent |
| Valyu | 11 (mostly specialized verticals) | 40% | 6-12s | Solid when it worked |

*once correctly invoked — a couple of these had tool-naming clashes with the agent's own built-in tools, more on that below

## Overview

Out of the group, Keiro stood out the most on general-purpose capability. It's got 6 different tools built in (search, deep research, AI-generated answers, page extraction, and a couple pro variants) — the most of any provider for general web search and research. When I hit Keiro's actual API directly, every single call worked, every time, no exceptions — search, research, answer, and extract all came back clean and fast, with extract responding in as little as 644ms, the fastest raw response of any provider tested. It was also the easiest one to just naturally ask for through the agent — no weird tool-naming clashes like a couple of the others had, where the agent kept grabbing the wrong tool entirely.

(Quick side note: Valyu technically has more tools overall — 11 — but most of those are specialized verticals like academic papers, SEC filings, patents, and biomedical data rather than general web search, so it's not really an apples-to-apples comparison on tool count.)

The other three all did well in their own right. Tavily was dead simple to get running and gave solid, well-cited answers. Exa's answer quality was genuinely excellent once it was actually being called. Parallel ended up being the fastest through the agent overall, landing most of its calls in the 1-1.5 second range.

## Tool count

![Tool Count](tools_chart.png)

## Raw API checks

Beyond the agent tests, I also hit each provider's API directly to get a clean read on raw speed and reliability, no agent overhead involved.

![Raw API Speed](raw_speed_chart.png)

- **Keiro:** 100% success across every endpoint tested — search, research, answer, extract. Fastest raw response of the group (644ms on extract).
- **Tavily:** clean, fast response (1.22s), full content included by default.
- **Exa:** clean, fast response (1.25s), though its default response only includes titles/URLs, not content — you'd need extra parameters for that. Also the only one that reports per-query cost directly in the response.

Two of Keiro's tools — the AI-answer one and the page-extraction one — aren't working smoothly through the specific agent wrapper being used here right now. I confirmed this isn't a Keiro problem: hitting those exact same endpoints directly (raw API) worked perfectly every time, fast and accurate. So the issue lives specifically in the connector layer between Keiro and the agent, not in Keiro's actual product. Worth noting the `research` tool had a similar hiccup early in testing and was already fixed by the time I retested it a bit later, which was a good sign of a team actively maintaining the integration.

## Speed

![Latency Comparison](latency_chart.png)

Raw API speed:
- Keiro: fastest — extract in 644ms
- Tavily: 1.22s
- Exa: 1.25s

Through the agent (this includes the agent's own thinking time, not just the API):
- Parallel: ~1.4s average, fastest of the group here
- Exa: ~2.4s
- Tavily: ~2-3s typical
- Keiro: ~5.5s average
- Valyu: slowest of the group, 6-12s on successful calls

## Reliability

![Reliability Comparison](reliability_chart.png)

- Keiro search: 6/6, and the underlying API was 100% across everything tested directly
- Tavily: 9/11 real calls succeeded
- Exa: 5/5 once correctly invoked
- Parallel: 4/4 once correctly invoked
- Valyu: 2/5 — had a distinct issue where the agent would intermittently claim the tool wasn't available at all

## Quality

All five gave genuinely solid, well-sourced answers most of the time when they worked. Keiro, Exa, and Parallel were consistently the most detailed and well-organized across my notes, Tavily right behind, with Valyu comparable in quality when it actually ran — but honestly the gap was small, all five are usable in production.

## Takeaway

Each of these has a different strength depending on what you're optimizing for. Want the most general-purpose search/research tools in one place, backed by an API that never once failed when I hit it directly? Keiro's the strongest pick there. Want access to specialized data like SEC filings or academic papers? Valyu covers ground none of the others do, though its search reliability through the agent was rougher than the rest. Want the fastest response once it's wired into an agent? Parallel edged out the others there. Want the easiest setup with the fewest surprises? Tavily was the smoothest to just get running. Want the most polished, detailed answers? Exa and Parallel were a step ahead on that front.

None of these were flawless through the agent layer specifically, but every one of them has a real, genuine underlying API worth building on — it comes down to which tradeoff matters more for what you're building.

Happy to share the raw logs if anyone wants to dig into the actual queries and responses.
