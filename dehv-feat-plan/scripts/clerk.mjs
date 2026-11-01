#!/usr/bin/env node
// Deterministic clerk jobs of dehv-feat-plan, as specified in references/clerk.md.
//   clerk.mjs open --name <name> --cwd <dir> [--view status|step|history] [--arg <value>]
//   clerk.mjs setup --plans-dir <path> [--approved]
//   clerk.mjs create --name <name>
//   clerk.mjs apply --name <name>   (JSON job on stdin, see applyJob)
import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const expand = (path) => resolve(path.replace(/^~(?=$|\/)/, homedir()))
const STATE_DIR = join(expand(process.env.XDG_STATE_HOME || '~/.local/state'), 'dehv-feat-plan')
const CONFIG = join(STATE_DIR, 'config')
const REGISTRY = join(STATE_DIR, 'plans.tsv')
const REGISTRY_HEADER = 'name\tplans_dir\tcreated\tupdated'

const pad = (value) => String(value).padStart(2, '0')
const now = new Date()
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
const nowTime = `${today} ${pad(now.getHours())}:${pad(now.getMinutes())}`

const fail = (message) => {
  console.error(`clerk: ${message}`)
  process.exit(1)
}

const read = (path) => readFileSync(path, 'utf8')
const isPlaceholder = (text) => !text || /<[^>]+>/.test(text)
const entryLabel = (number) => `H${String(number).padStart(4, '0')}`

// ---- Registry and config

const readConfig = () => {
  if (!existsSync(CONFIG)) return null
  const line = read(CONFIG).split('\n').find((row) => row.startsWith('plans_dir='))
  return line ? line.slice('plans_dir='.length).trim() : null
}

const readRegistry = () => {
  if (!existsSync(REGISTRY)) return []
  return read(REGISTRY).split('\n').slice(1).filter(Boolean).map((row) => {
    const [name, plansDir, created, updated] = row.split('\t')
    return { name, plansDir, created, updated }
  })
}

const writeRegistry = (rows) => {
  mkdirSync(STATE_DIR, { recursive: true })
  const body = rows.map((row) => [row.name, row.plansDir, row.created, row.updated].join('\t'))
  writeFileSync(REGISTRY, [REGISTRY_HEADER, ...body].join('\n') + '\n')
}

const touchRegistry = (name, plansDir) => {
  const rows = readRegistry()
  const row = rows.find((candidate) => candidate.name === name)
  if (row) row.updated = today
  else rows.push({ name, plansDir, created: today, updated: today })
  writeRegistry(rows)
}

const resolvePlan = (name) => {
  const row = readRegistry().find((candidate) => candidate.name === name)
  if (row) {
    const folder = join(row.plansDir, name)
    return { state: existsSync(folder) ? 'found' : 'missing', folder }
  }
  const plansDir = readConfig()
  if (!plansDir) return { state: 'new', folder: null }
  const folder = join(plansDir, name)
  if (!existsSync(join(folder, 'PLAN.md'))) return { state: 'new', folder }
  touchRegistry(name, plansDir)
  return { state: 'found', folder }
}

const requirePlan = (name) => {
  const plan = resolvePlan(name)
  if (plan.state !== 'found') fail(`plan ${name} is ${plan.state}`)
  return plan.folder
}

// ---- Markdown helpers. Headings inside four-backtick fences belong to a brief or a report.

const sectionRange = (lines, heading) => {
  let inFence = false
  let start = -1
  for (let index = 0; index < lines.length; index++) {
    if (lines[index].startsWith('````')) inFence = !inFence
    if (inFence || !lines[index].startsWith('## ')) continue
    if (start >= 0) return [start, index]
    if (lines[index].trim() === `## ${heading}`) start = index
  }
  return start >= 0 ? [start, lines.length] : null
}

const section = (text, heading) => {
  const lines = text.split('\n')
  const range = sectionRange(lines, heading)
  return range ? lines.slice(range[0] + 1, range[1]).join('\n').trim() : ''
}

const appendToSection = (text, heading, line) => {
  const lines = text.split('\n')
  const range = sectionRange(lines, heading)
  if (!range) return `${text.trimEnd()}\n\n## ${heading}\n\n${line}\n`
  let end = range[1]
  while (end > range[0] + 1 && lines[end - 1].trim() === '') end--
  const hasBody = end > range[0] + 1
  const insert = hasBody ? [line] : ['', line]
  const tail = lines.slice(range[1])
  const gap = tail.length ? [''] : []
  return [...lines.slice(0, end), ...insert, ...gap, ...tail].join('\n').trimEnd() + '\n'
}

const dropTemplateLines = (text, heading) => {
  const lines = text.split('\n')
  const range = sectionRange(lines, heading)
  if (!range) return text
  const body = lines.slice(range[0] + 1, range[1]).filter((line) => !/^- .*<[^>]+>/.test(line))
  return [...lines.slice(0, range[0] + 1), ...body, ...lines.slice(range[1])].join('\n')
}

const tableCells = (row) => row.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim())
const isDataRow = (row) => row.trim().startsWith('|') && !/^\|\s*-/.test(row.trim())

const headerField = (text, field) => {
  const match = new RegExp(`^- \\*\\*${field}:\\*\\* (.*)$`, 'm').exec(text)
  return match ? match[1].trim() : ''
}

const setHeaderField = (text, field, value) => {
  const pattern = new RegExp(`^- \\*\\*${field}:\\*\\* .*$`, 'm')
  if (pattern.test(text)) return text.replace(pattern, () => `- **${field}:** ${value}`)
  return text.replace(/^- \*\*Result:\*\* .*$/m, (line) => `${line}\n- **${field}:** ${value}`)
}

// ---- Plan state

const readSteps = (folder) => {
  const plan = read(join(folder, 'PLAN.md'))
  const rows = section(plan, 'Steps').split('\n').filter(isDataRow).slice(1)
  return rows.map(tableCells).filter((cells) => /^\d+$/.test(cells[0])).map((cells) => {
    const link = /\[(.*?)\]\((.*?)\)/.exec(cells[1])
    const file = link ? link[2] : null
    return {
      number: cells[0],
      title: link ? link[1] : cells[1],
      file: file && join(folder, file),
      slug: file ? basename(file, '.md').replace(/^\d+-/, '') : '',
      status: cells[2],
    }
  })
}

const dependsOn = (step) => {
  if (!step.file || !existsSync(step.file)) return []
  return (headerField(read(step.file), 'Depends on').match(/\d+/g) || []).map((value) => value.padStart(2, '0'))
}

const nextStep = (steps) => {
  const done = new Set(steps.filter((step) => ['Done', 'Skipped'].includes(step.status)).map((step) => step.number))
  return steps.find((step) => step.status === 'NotStarted' && dependsOn(step).every((number) => done.has(number)))
}

const goalOf = (step) => {
  if (!step.file || !existsSync(step.file)) return ''
  return section(read(step.file), 'Goal').split('\n')[0]
}

const matchStep = (steps, value) => {
  const number = /^\d+$/.test(value) ? value.padStart(2, '0') : null
  return steps.find((step) => step.number === number || step.slug === value)
}

const readEntries = (folder) => {
  const dir = join(folder, 'history')
  if (!existsSync(dir)) return []
  return readdirSync(dir).filter((file) => /^\d{4}-.*\.md$/.test(file)).sort().map((file) => {
    const text = read(join(dir, file))
    const closed = headerField(text, 'Closed')
    const result = headerField(text, 'Result')
    const title = /^# H\d+ · .*? · (.*)$/m.exec(text)
    return {
      id: `H${file.slice(0, 4)}`,
      file,
      path: join(dir, file),
      text,
      title: title ? title[1] : file,
      date: headerField(text, 'Date').slice(0, 10),
      flag: headerField(text, 'Flag').replace(/^--/, ''),
      step: headerField(text, 'Step'),
      agent: headerField(text, 'Agent'),
      result,
      isOpen: closed === 'open' || ['Running', 'Blocked'].includes(result),
    }
  })
}

const nextEntry = (folder) => {
  const last = readEntries(folder).at(-1)
  return entryLabel(last ? Number(last.id.slice(1)) + 1 : 1)
}

const writeIndex = (folder, name) => {
  const rows = readEntries(folder).map((entry) =>
    `| ${entry.id} | ${entry.date} | ${entry.flag} | ${entry.step} | ${entry.title} | ${entry.result} | [${entry.id}](${entry.file}) |`)
  mkdirSync(join(folder, 'history'), { recursive: true })
  writeFileSync(join(folder, 'history', 'INDEX.md'), [
    `# History · ${name}`,
    '',
    '| # | Date | Flag | Step | Task | Result | Entry |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n'))
}

const writeClerkEntry = (folder, id, { flag, step, title }) => {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const file = `${id.slice(1)}-${flag.replace(/^--/, '')}-${slug}.md`
  const path = join(folder, 'history', file)
  if (existsSync(path)) fail(`entry ${file} already exists`)
  writeFileSync(path, [
    `# ${id} · ${flag} · ${title}`,
    '',
    `- **Date:** ${nowTime}`,
    `- **Flag:** ${flag}`,
    `- **Step:** ${step}`,
    '- **Agent:** clerk',
    '- **Result:** Done',
    `- **Closed:** ${nowTime}`,
    '- **Continues:** none',
    '',
    '## User',
    '',
    '## Applied',
    '',
  ].join('\n'))
  return path
}

// ---- Views

const statusView = (folder) => {
  const plan = read(join(folder, 'PLAN.md'))
  const steps = readSteps(folder)
  const blocked = steps.filter((step) => step.status === 'Blocked')
  const next = nextStep(steps)
  const last = readEntries(folder).at(-1)
  return [
    section(plan, 'Steps'),
    '',
    `Blocked: ${blocked.map((step) => `${step.number} ${step.title}`).join(' · ') || 'none'}`,
    `Next step: ${next ? `${next.number}-${next.slug} — ${goalOf(next)}` : 'none'}`,
    `Last entry: ${last ? `${last.id} ${last.date} ${last.title} (${last.result})` : 'none'}`,
  ].join('\n')
}

const entriesOfStep = (entries, step) =>
  entries.filter((entry) => entry.step === `${step.number}-${step.slug}` || entry.step === step.number)

const entryLines = (entries) =>
  entries.map((entry) => `${entry.id} · ${entry.date} · ${entry.title} · ${entry.result}`).join('\n') || 'none'

const stepView = (folder, value) => {
  const step = matchStep(readSteps(folder), value)
  if (!step) fail(`step ${value} not found`)
  const text = step.file && existsSync(step.file) ? read(step.file) : ''
  const checklist = section(text, 'Checklist').split('\n')
  const total = checklist.filter((line) => /^- \[[ x]\]/.test(line)).length
  const ticked = checklist.filter((line) => /^- \[x\]/.test(line)).length
  return [
    `### ${step.number} · ${step.title} · ${step.status}`,
    `**Goal** ${section(text, 'Goal')}`,
    `**Scope**\n${section(text, 'Scope')}`,
    `**Checklist** ${ticked}/${total}`,
    `**Deviations** ${section(text, 'Deviations') || '(none)'}`,
    `**History**\n${entryLines(entriesOfStep(readEntries(folder), step))}`,
  ].join('\n\n')
}

const entryView = (entry) => {
  const report = section(entry.text, 'Report').replace(/^````(markdown)?$/gm, '')
  return [
    `### ${entry.id} · ${entry.flag} · ${entry.title}`,
    `Date: ${headerField(entry.text, 'Date')} · Step: ${entry.step} · Agent: ${entry.agent} · Result: ${entry.result}`,
    `**Summary**\n${section(report, 'Summary') || 'none'}`,
    `**Files changed**\n${section(report, 'Files changed') || 'none'}`,
    `**User**\n${section(entry.text, 'User') || 'none'}`,
    `**Applied**\n${section(entry.text, 'Applied') || 'none'}`,
    `Path: ${entry.path}`,
  ].join('\n\n')
}

const historyView = (folder, value) => {
  const entries = readEntries(folder)
  if (!value) {
    const index = read(join(folder, 'history', 'INDEX.md')).trimEnd().split('\n')
    const rows = index.slice(4)
    if (rows.length <= 20) return index.join('\n')
    return [...index.slice(0, 4), ...rows.slice(-20), '', `Last 20 of ${rows.length} entries.`].join('\n')
  }
  const steps = readSteps(folder)
  const step = /^[hH]/.test(value) ? null : matchStep(steps, value)
  if (step) return `### ${step.number} · ${step.title}\n\n${entryLines(entriesOfStep(entries, step))}`
  const digits = /^[hH]?(\d+)$/.exec(value)
  const entry = digits && entries.find((candidate) => Number(candidate.id.slice(1)) === Number(digits[1]))
  if (!entry) fail(`no step or entry matches ${value}`)
  return entryView(entry)
}

// ---- Jobs

const open = ({ name, cwd, view, arg }) => {
  if (!name) fail('open needs --name')
  const plan = resolvePlan(name)
  const plansDir = readConfig()
  const lines = [
    `Plan: ${name} · ${plan.state} · ${plan.folder || 'none'}`,
    `Config: ${plansDir ? `plans_dir=${plansDir}` : 'missing'}`,
  ]
  if (plan.state !== 'found') {
    lines.push('Next entry: H0001')
    console.log(lines.join('\n'))
    return
  }
  const { folder } = plan
  writeIndex(folder, name)
  const text = read(join(folder, 'PLAN.md'))
  const steps = readSteps(folder)
  const next = nextStep(steps)
  const entries = readEntries(folder)
  const repos = cwd ? [`${basename(cwd)} → ${resolve(cwd)}`] : []
  const repoLine = /^- Repos: (.*)$/m.exec(section(text, 'Links'))
  if (repoLine && !isPlaceholder(repoLine[1])) {
    for (const repo of repoLine[1].split(',').map((part) => part.trim())) {
      const path = repo.split('→')[1]?.trim()
      if (!cwd || !path || expand(path) !== resolve(cwd)) repos.push(repo)
    }
  }
  const openItems = [
    ...entries.filter((entry) => entry.isOpen).map((entry) =>
      `${entry.id} ${['Running', 'Blocked'].includes(entry.result) ? entry.result : `${entry.result}, not closed`}`),
    ...steps.filter((step) => step.status === 'Blocked').map((step) => `${step.number} Blocked`),
  ]
  const appUrlRow = section(text, 'Values').split('\n').find((row) => tableCells(row)[0] === 'App URL')
  const appUrl = appUrlRow && tableCells(appUrlRow)[1]
  lines.push(
    `Next entry: ${nextEntry(folder)}`,
    `Repos: ${repos.join(', ') || 'none'}`,
    `Steps: ${steps.map((step) => `${step.number} ${step.status}`).join(' · ') || 'none'}`,
    `Next step: ${next ? `${next.number}-${next.slug} — ${goalOf(next)}` : 'none'}`,
    `Open: ${openItems.join(' · ') || 'none'}`,
    `App URL: ${isPlaceholder(appUrl) ? 'none' : appUrl}`,
  )
  if (view === 'status') lines.push('', statusView(folder))
  if (view === 'step') lines.push('', stepView(folder, arg))
  if (view === 'history') lines.push('', historyView(folder, arg))
  console.log(lines.join('\n'))
}

const setup = ({ 'plans-dir': plansDirArg, approved }) => {
  if (!plansDirArg) fail('setup needs --plans-dir')
  const plansDir = expand(plansDirArg)
  if (!existsSync(plansDir)) {
    if (!approved) fail(`${plansDir} doesn't exist: ask the user, then pass --approved`)
    mkdirSync(plansDir, { recursive: true })
  }
  mkdirSync(STATE_DIR, { recursive: true })
  writeFileSync(CONFIG, `plans_dir=${plansDir}\n`)
  console.log(`Config: plans_dir=${plansDir}`)
}

const create = ({ name }) => {
  if (!name) fail('create needs --name')
  const plansDir = readConfig()
  if (!plansDir) fail('config is missing: run setup first')
  const plan = resolvePlan(name)
  if (plan.state !== 'new') fail(`plan ${name} is ${plan.state}: never overwrite`)
  const folder = join(plansDir, name)
  if (existsSync(folder)) fail(`${folder} already exists: never overwrite`)
  mkdirSync(join(folder, 'history'), { recursive: true })
  const planText = read(join(SKILL_DIR, 'references', 'plan-template.md'))
    .replaceAll('<plans_dir>/<name>/', `${folder}/`)
    .replaceAll('<name>', name)
    .replaceAll('YYYY-MM-DD', today)
    .replace(/^\| 01 \| \[<step title>\].*\n/m, '')
  writeFileSync(join(folder, 'PLAN.md'), planText)
  writeClerkEntry(folder, 'H0001', { flag: 'create', step: 'plan', title: 'Create plan folder' })
  writeIndex(folder, name)
  touchRegistry(name, plansDir)
  console.log(`Plan created: ${folder} (H0001)`)
}

// stdin JSON, every key optional:
// { "statuses": [{ "step": "02", "status": "InReview", "entry": "H0009" }],
//   "logs": ["plan rescoped (H0009)"],
//   "values": [{ "key": "App URL", "value": "http://…", "step": "" }],
//   "answers": [{ "entry": "H0009", "q": "…", "a": "…" }],
//   "applied": [{ "entry": "H0009", "text": "…" }],
//   "close": ["H0009"],
//   "newEntry": { "flag": "--continue", "step": "plan", "title": "Apply status shortcuts" } }
// A status, answer or applied item with no entry goes in newEntry's entry.
const applyJob = ({ name }) => {
  if (!name) fail('apply needs --name')
  const folder = requirePlan(name)
  const job = JSON.parse(readFileSync(0, 'utf8') || '{}')
  const out = []
  const newId = job.newEntry ? nextEntry(folder) : null
  if (job.newEntry) {
    writeClerkEntry(folder, newId, job.newEntry)
    out.push(`Entry ${newId} written`)
  }
  const entryFor = (id) => {
    const entry = readEntries(folder).find((candidate) => candidate.id === (id || newId))
    if (!entry) fail(`entry ${id || 'newEntry'} not found`)
    return entry
  }
  const planPath = join(folder, 'PLAN.md')
  let plan = read(planPath)

  for (const change of job.statuses || []) {
    const id = change.entry || newId
    const step = matchStep(readSteps(folder), change.step)
    if (!step) fail(`step ${change.step} not found`)
    const logLine = `- ${today}: step ${step.number} → ${change.status} (${id})`
    plan = plan.split('\n').map((row) => {
      if (!isDataRow(row) || tableCells(row)[0] !== step.number) return row
      const cells = tableCells(row)
      cells[2] = change.status
      cells[4] = today
      return `| ${cells.join(' | ')} |`
    }).join('\n')
    plan = appendToSection(plan, 'Log', logLine)
    writeFileSync(planPath, plan)
    if (step.file && existsSync(step.file)) {
      const text = setHeaderField(read(step.file), 'Status', change.status)
      writeFileSync(step.file, appendToSection(text, 'Log', logLine))
    }
    out.push(`Step ${step.number} → ${change.status} (${id})`)
  }

  for (const line of job.logs || []) {
    plan = appendToSection(plan, 'Log', `- ${today}: ${line}`)
    out.push(`Log: ${line}`)
  }

  for (const { key, value, step = '' } of job.values || []) {
    const row = `| ${key} | ${value} | ${step} |`
    const lines = plan.split('\n')
    const range = sectionRange(lines, 'Values')
    if (!range) fail('PLAN.md has no Values section')
    let at = -1
    let lastRow = range[0]
    for (let index = range[0]; index < range[1]; index++) {
      if (!lines[index].trim().startsWith('|')) continue
      lastRow = index
      if (tableCells(lines[index])[0] === key) at = index
    }
    if (at >= 0) lines[at] = row
    else lines.splice(lastRow + 1, 0, row)
    plan = lines.join('\n')
    out.push(`Value: ${key}`)
  }
  plan = plan.replace(/Last update \d{4}-\d{2}-\d{2}/, `Last update ${today}`)
  writeFileSync(planPath, plan)

  const editOpenEntry = (entry, edit) => {
    if (!entry.isOpen && entry.id !== newId) fail(`${entry.id} is closed: use a new entry that names it`)
    writeFileSync(entry.path, edit(read(entry.path)))
  }
  for (const { entry: id, q, a } of job.answers || []) {
    editOpenEntry(entryFor(id), (text) => appendToSection(dropTemplateLines(text, 'User'), 'User', `- Q: ${q} → A: ${a}`))
  }
  for (const { entry: id, text: line } of job.applied || []) {
    editOpenEntry(entryFor(id), (text) => appendToSection(dropTemplateLines(text, 'Applied'), 'Applied', `- ${line}`))
  }

  for (const id of job.close || []) {
    const entry = entryFor(id)
    let text = read(entry.path)
    if (!entry.isOpen) fail(`${id} is already closed`)
    const report = section(text, 'Report').replace(/^````.*$/gm, '').trim()
    const hasReport = report !== '' && !report.startsWith('<')
    if (entry.result === 'Running' && entry.agent !== 'clerk' && !hasReport) {
      text = setHeaderField(text, 'Result', 'Failed')
      text = appendToSection(dropTemplateLines(text, 'Applied'), 'Applied', '- report missing')
      out.push(`${id}: report missing, set to Failed`)
    }
    writeFileSync(entry.path, setHeaderField(text, 'Closed', nowTime))
    out.push(`${id} closed`)
  }

  writeIndex(folder, name)
  touchRegistry(name, dirname(folder))
  console.log(out.join('\n') || 'Nothing to apply')
}

// ---- CLI

const parseArgs = (argv) => {
  const args = {}
  for (let index = 0; index < argv.length; index++) {
    const key = argv[index].replace(/^--/, '')
    if (key === 'approved') args.approved = true
    else args[key] = argv[++index]
  }
  return args
}

const jobs = { open, setup, create, apply: applyJob }
const [job, ...rest] = process.argv.slice(2)
if (!jobs[job]) fail(`unknown job ${job}. Jobs: ${Object.keys(jobs).join(', ')}`)
jobs[job](parseArgs(rest))
