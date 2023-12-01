import Head from "next/head";
import Link from "next/link";
import { Autocomplete, FormControl } from "@primer/react";
import { BaseStyles, Box, Heading } from "@primer/react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { useEffect, useState } from "react";

export default function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);
  return (
    <>
      <Head>
        <title>Primer Autocomplete</title>
        <meta
          name="description"
          content="Trying to use Primer React Autocomplete"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main style={{ margin: 50 }}>
        <BaseStyles>
          <Heading>Search to your heart's content</Heading>
          {ready && <Search />}
        </BaseStyles>
      </main>
    </>
  );
}

type TypeaheadHit = {
  id: string;
  term: string;
};
type ServerResponse = {
  hits: TypeaheadHit[];
  meta: {
    found: {
      value: number;
    };
    shown: number;
    took: {
      query_sec: number;
      total_sec: number;
    };
    search: {
      query: string;
      size: number;
    };
  };
};

type MenuItem = {
  text: string;
  id: string;
};

type PreviousSearch = {
  query: string;
  found: number;
};

function dontBother(previousSearch: PreviousSearch | null, query: string) {
  if (!previousSearch) return false;

  if (previousSearch.found === 0) {
    if (query.startsWith(previousSearch.query)) {
      return true;
    }
  }

  return false;
}

function Search() {
  const [typedInput, setTypedInput] = useState("");
  const debouncedValue = useDebounce(typedInput, 100);

  // Record the outcome of every XHR request such that it can be used
  // later to determine if we should bother making a request.
  // If the previous search for "foo" found 0 results, and the input
  // is now "food", don't bother sending another XHR query.
  const [previousSearch, setPreviousSearch] = useState<PreviousSearch | null>(
    null
  );

  const apiURL =
    debouncedValue.trim() && !dontBother(previousSearch, debouncedValue.trim())
      ? `/api/search/typeahead?${new URLSearchParams({
          query: debouncedValue,
        })}`
      : null;

  const { data, isLoading } = useSWR<ServerResponse, Error>(
    apiURL,
    async (url: string) => {
      const response = await fetch(url);
      return response.json();
    },
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (data) {
      setPreviousSearch({
        query: data.meta.search.query,
        found: data.meta.found.value,
      });
    }
  }, [data]);

  const [stillLoading, setStillLoading] = useState(false);
  useEffect(() => {
    let timer: number | null = null;

    if (isLoading) {
      timer = window.setTimeout(() => {
        setStillLoading(true);
      }, 1000);
    } else if (timer) {
      window.clearTimeout(timer);
      timer = null;
      setStillLoading(false);
    } else {
      setStillLoading(false);
    }

    return () => {
      if (timer !== null) window.clearInterval(timer);
    };
  }, [isLoading]);

  const items: MenuItem[] = [];

  if (data && data.hits) {
    items.push(...data.hits.map((hit) => ({ text: hit.term, id: hit.id })));
  }
  // console.log(JSON.stringify(items, undefined, 2));

  const router = useRouter();

  const filterFunctionNeedle = typedInput.trim()
    ? new RegExp(`\\b${regexEscape(typedInput.trim())}`, "i")
    : null;
  const filteredItems = items.filter((item) => {
    if (!filterFunctionNeedle) return true;
    return filterFunctionNeedle.test(item.text);
  });

  let displayMenu = Boolean(filteredItems.length > 0 && typedInput.trim());
  if (!filteredItems.length && !typedInput.trim()) {
    const previous = getSubmittedQueries();
    if (previous.length) {
      filteredItems.push(...previous.map((text) => ({ text, id: text })));
      displayMenu = true;
    }
  }

  const NO_SUGGESTIONS_ID = "no-suggestions";

  // console.log({
  //   filteredItems: filteredItems.length,
  //   typedInput,
  //   isLoading,
  //   stillLoading,
  // });

  if (!filteredItems.length && debouncedValue.trim() && !isLoading) {
    filteredItems.push({
      text: `Search for '${typedInput}'`,
      id: NO_SUGGESTIONS_ID,
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (typedInput.trim()) {
          // setTypedInput("");
          rememberSubmittedQuery(typedInput.trim());
          router.push(`/?${new URLSearchParams({ query: typedInput })}`);
          console.log("SUBMITTED");
        }
      }}
    >
      <FormControl>
        <FormControl.Label id="autocompleteLabel" visuallyHidden>
          Pick a branch
        </FormControl.Label>
        <Autocomplete>
          <Autocomplete.Input
            value={typedInput}
            onChange={(event) => {
              // console.log("INPUT CHANGED TO", { value: event.target.value });
              setTypedInput(event.target.value);
            }}
          />
          <Autocomplete.Overlay>
            {true && (
              <Autocomplete.Menu
                filterFn={(item: MenuItem) => {
                  // console.log("COMPARE", item, { QUERY: typedInput });
                  // if (filterFunctionNeedle) {
                  //   return filterFunctionNeedle.test(item.text);
                  // }
                  return true;
                }}
                items={filteredItems}
                selectedItemIds={[]}
                emptyStateText={false}
                sortOnCloseFn={() => 0}
                selectionVariant="single"
                aria-labelledby="autocompleteLabel"
                loading={stillLoading}
                onSelectedChange={(items: MenuItem | MenuItem[]) => {
                  for (const item of Array.isArray(items) ? items : [items]) {
                    if (item.id === NO_SUGGESTIONS_ID) {
                      router.push(
                        `/?${new URLSearchParams({ query: typedInput })}`
                      );
                      return;
                    }
                  }

                  if (Array.isArray(items) && items.length > 0) {
                    // setTypedInput("");
                    const text = items[0].text;
                    rememberSubmittedQuery(text);
                    router.push(`/?${new URLSearchParams({ query: text })}`);
                    // console.log("SELECTED");
                  } else {
                    console.warn("NO ITEMS!!!", items);
                    throw new Error("no items! (how can this even happen??)");
                  }
                }}
              />
            )}
          </Autocomplete.Overlay>
        </Autocomplete>
      </FormControl>
      <hr style={{ marginTop: 200 }} />

      <h3>Debugging </h3>
      <p>
        <b>isLoading:</b>
        <code>{JSON.stringify(isLoading)}</code>
      </p>
      <p>
        <b>filtered items</b>
      </p>
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ul>
      <p>
        <button
          onClick={() => {
            sessionStorage.removeItem("previousSearches");
            location.reload();
          }}
        >
          Reset search history
        </button>
        <br />
        <code>{sessionStorage.getItem("previousSearches")}</code>
      </p>

      <ol>
        {items.map((item) => (
          <li key={item.id}>{item.text}</li>
        ))}
      </ol>
    </form>
  );
}

function rememberSubmittedQuery(query: string, key = "previousSearches") {
  if (!query.trim()) throw new Error("empty");

  console.log("REMEMBER", { query });

  try {
    const previousQueries: string[] = JSON.parse(
      sessionStorage.getItem(key) || "[]"
    );
    const newQueries = [query, ...previousQueries.filter((x) => x !== query)];
    sessionStorage.setItem(key, JSON.stringify(newQueries.slice(0, 25)));
  } catch (err) {
    console.warn("Saving to local storage failed", err);
  }
}

function getSubmittedQueries(key = "previousSearches") {
  try {
    const previousQueries: string[] = JSON.parse(
      sessionStorage.getItem(key) || "[]"
    );
    return previousQueries;
  } catch (err) {
    console.warn("Retrieving from local storage failed", err);
    return [];
  }
}

function regexEscape(str: string) {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
