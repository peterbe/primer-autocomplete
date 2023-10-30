# primer-autocomplete

Using the `@primer/react` component to build a typeahead search feature.

## Kusto

Kusto query used to generated the `popular-queries.csv` downloaded CSV
export:

```kusto
  database('hydro').table('analytics_v0_browser_event')
  | where timestamp > ago(30d)
  | where app == 'thehub'
  | where event == 'search_result'
  | where context['search_result_total'] > 0
  | summarize count() by tostring(context['search_result_query'])
  | order by count_ desc
  | take 1000
```

## Mock server

You have to start a server on `localhost:8000`. You need to have Bun
installed. Run:

```sh
npm run mock-server
```
