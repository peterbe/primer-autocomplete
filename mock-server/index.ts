/**
 *
 * Run this from the repo root with:
 *
 *   bun run --hot mock-server/index.ts
 *
 */

type Popular = {
  query: string;
  count: number;
};
const popularFile = Bun.file("mock-server/popular-queries.json");

const server = Bun.serve({
  port: 8000,
  async fetch(request: Request) {
    const { pathname, search } = new URL(request.url);
    if (
      pathname === "/api/search/typeahead" ||
      pathname === "/api/search/autocomplete"
    ) {
      console.log("> SEARCH", search);
      return Response.json(await searchResults(new URLSearchParams(search)));
    } else if (pathname == "/") {
      return new Response("Hi");
    }
    return new Response("not found", { status: 404 });
  },
});

console.log(`Listening on localhost: ${server.port}`);

type Hit = {
  id: string;
  term: string;
};
const SIZE = 10;
async function searchResults(x: URLSearchParams) {
  const t0 = new Date();

  const popular: Popular[] = await popularFile.json();

  const query = x.get("query") || "";
  let needled: RegExp | null = null;
  if (query) {
    needled = new RegExp(`\\b${regexEscape(query)}`, "i");
  }
  const hits: Hit[] = [];
  let found = 0;

  for (const { query, count } of popular) {
    if (!needled || needled.test(query)) {
      found++;
      if (hits.length < SIZE) {
        hits.push({
          id: `${query}:${count}`,
          term: query,
        });
      }
    }
  }
  const t1 = new Date();

  await sleep(Math.random() * 3);

  const t2 = new Date();

  return {
    hits,
    meta: {
      found: {
        value: found,
        relation: "eq",
      },
      shown: hits.length,
      took: {
        query_sec: (t1.getTime() - t0.getTime()) / 1000,
        total_sec: (t2.getTime() - t0.getTime()) / 1000,
      },
      search: {
        query,
        size: SIZE,
      },
    },
  };
}

function regexEscape(s: string) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

async function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
