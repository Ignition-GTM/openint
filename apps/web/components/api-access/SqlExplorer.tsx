'use client'

import {useQuery} from '@tanstack/react-query'
import {Button, CircularProgress} from '@usevenice/ui'
import {PlayIcon} from '@usevenice/ui/icons'
import React, {useEffect, useState} from 'react'
import {DataTable} from '../DataTable'
import {Editor} from '../Editor'

export interface SqlExplorerProps {
  pat?: string
  selectables: Array<{name: string; type: 'table' | 'view'}>
}

const queryTextForTable = (tableName: string | undefined | null) =>
  tableName ? `SELECT * from "${tableName}" LIMIT 10` : ''

/**
 * TODO: 1) Allow copy database url 2) Allow download sql
 */
export function SqlExplorer({selectables}: SqlExplorerProps) {
  const [queryText, setQueryText] = useState(
    queryTextForTable(selectables[0]?.name),
  )

  const sqlQuery = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['sql', queryText],
    queryFn: () => fetch(`/api/sql?q=${queryText}`).then((r) => r.json()),
    // set low cache time because we don't want useQuery to return
    // the cached result causing the output to update without user
    // explicitly execute the query leading to a confusing behavior.
    cacheTime: 1000,
    // manual fetching only
    enabled: false,
    // this is needed so the output is not wiped when selecting a different query
    keepPreviousData: true,
  })

  function handleTableClick(tableName: string) {
    setQueryText(queryTextForTable(tableName))
    setTimeout(() => {
      void sqlQuery.refetch()
    }, 0)
  }

  const resultTable = React.useMemo(
    () => (
      <DataTable isFetching={sqlQuery.isFetching} rows={sqlQuery.data ?? []} />
    ),
    [sqlQuery.isFetching, sqlQuery.data],
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="grid gap-6">
        <div className="grid h-[15rem] grid-cols-[minmax(min-content,12rem)_1fr] overflow-hidden rounded-lg border border-venice-black-300 bg-venice-black-500">
          {/* SavedQueryNav | SavedQuerySelect */}
          <nav className="grid gap-2 overflow-y-auto border-r border-venice-black-300 bg-venice-black py-3">
            <NavGroup
              title="Views"
              items={selectables
                .filter((s) => s.type === 'view')
                .map((s) => s.name)}
              onItemClick={handleTableClick}
            />
            <NavGroup
              title="Raw data"
              items={selectables
                .filter((s) => s.type === 'table' && s.name.startsWith('raw_'))
                .map((s) => s.name)}
              onItemClick={handleTableClick}
            />
            <NavGroup
              title="Meta data"
              items={selectables
                .filter((s) => s.type === 'table' && !s.name.startsWith('raw_'))
                .map((s) => s.name)}
              onItemClick={handleTableClick}
            />
          </nav>
          <div className="p-3">
            <Editor
              language="sql"
              value={queryText}
              onChange={(newValue) => setQueryText(newValue ?? '')}
              setKeybindings={(monaco) => [
                {
                  key: monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
                  run: () => sqlQuery.refetch(),
                },
              ]}
            />
          </div>
        </div>
        <ActionsBar
          isFetching={sqlQuery.isFetching}
          executeQuery={() => sqlQuery.refetch()}
        />
      </div>
      <div className="mt-2 flex-1 overflow-scroll">{resultTable}</div>
    </div>
  )
}

interface NavGroupProps {
  title: string
  items: string[]
  onItemClick: (itemId: string) => void
}

function NavGroup(props: NavGroupProps) {
  const {title, items, onItemClick} = props
  return (
    <div className="px-3 font-mono">
      <h5 className="text-sm text-venice-gray-muted">
        {title} ({items.length})
      </h5>
      <ul className="mt-1 grid gap-1 px-3 text-xs text-offwhite">
        {items.map((v) => (
          <li key={v}>
            <button onClick={() => onItemClick(v)}>{v}</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
interface ActionsBarProps extends ExecuteQueryActionGroupProps {}

export function ActionsBar(props: ActionsBarProps) {
  return (
    <section className="flex justify-between gap-4">
      <ExecuteQueryActionGroup {...props} />
      {/* OutputControlsActionGroup */}
      <div className="flex items-center gap-3">
        {/* <OutputFormatTabs
          options={[
            {key: 'OutputTabsKey.dataTable', label: 'Data Table'},
            {key: 'OutputTabsKey.json', label: 'JSON'},
            {key: 'OutputTabsKey.csv', label: 'CSV'},
          ]}
        /> */}
        {/* <Button
          variant="primary"
          className="gap-1"
          onClick={() => window.open(databaseQuery.getDownloadUrl())}>
          <DownloadIcon className="h-4 w-4 fill-current text-offwhite" />
          Download
        </Button> */}
      </div>
    </section>
  )
}

interface ExecuteQueryActionGroupProps {
  executeQuery: () => void
  isFetching: boolean
}

function ExecuteQueryActionGroup(props: ExecuteQueryActionGroupProps) {
  const {executeQuery, isFetching} = props

  // binds keyboard shortcuts
  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      // TODO handle Windows platform
      if (event.metaKey && event.key === 'Enter') {
        executeQuery()
      }
    }
    document.addEventListener('keydown', handleKeyboardShortcut)
    return () => document.removeEventListener('keydown', handleKeyboardShortcut)
  }, [executeQuery])

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="primary"
        className="gap-1"
        onClick={executeQuery}
        disabled={isFetching}>
        {isFetching ? (
          <CircularProgress className="h-4 w-4 fill-offwhite text-offwhite/50" />
        ) : (
          <PlayIcon className="h-4 w-4 fill-current text-offwhite" />
        )}
        Execute
      </Button>
      <span className="inline-flex font-mono text-sm text-venice-gray-muted">
        or hit ⌘ + Enter
      </span>
    </div>
  )
}