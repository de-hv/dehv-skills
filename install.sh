#!/usr/bin/env bash
# Links every skill of this repo (each folder with a SKILL.md) into an agent's skills folder,
# one symlink per skill. Run ./install.sh -h for the options.

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
PROG=$(basename "$0")

# id|name|skills folder|folder that means the agent is installed|note
PROVIDERS=(
  "claude|Claude Code|$HOME/.claude/skills|$HOME/.claude|"
  "agents|Agents (shared)|$HOME/.agents/skills|$HOME/.agents|Codex, Gemini, OpenCode"
  "cursor|Cursor|$HOME/.cursor/skills|$HOME/.cursor|"
  "copilot|Copilot CLI|$HOME/.copilot/skills|$HOME/.copilot|"
)

usage() {
  cat <<EOF
Usage: $PROG [options]

Links each skill of this repo into an agent's skills folder (one symlink per skill).
Without options it asks where to link them.

Options:
  -t, --target LIST   Comma-separated targets: claude, agents, cursor, copilot or a path
  -y, --yes           Apply without asking
  -n, --dry-run       Show the plan and change nothing
      --force         Move a real file or folder in the way to <name>.bak-<date>
      --status        Show which targets have the skills linked
      --uninstall     Remove the links that point into this repo
  -h, --help          Show this help

Targets:
  claude    ~/.claude/skills
  agents    ~/.agents/skills   (Codex, Gemini CLI, OpenCode)
  cursor    ~/.cursor/skills
  copilot   ~/.copilot/skills

Examples:
  $PROG
  $PROG --target claude,agents --yes
  $PROG --target ~/work/skills --dry-run
  $PROG --uninstall --target claude
EOF
}

# ---------- output ----------

if [ -t 1 ] && [ -z "${NO_COLOR:-}" ]; then
  B=$'\033[1m' DIM=$'\033[2m' OK=$'\033[32m' WARN=$'\033[33m' ACC=$'\033[36m' ERR=$'\033[31m' R=$'\033[0m'
else
  B='' DIM='' OK='' WARN='' ACC='' ERR='' R=''
fi

die() { # message, exit code
  printf '%s: %s\n' "$PROG" "$1" >&2
  exit "${2:-1}"
}

short() { # ~ for $HOME, and keep the end of long paths
  local s=$1
  case $s in "$HOME"*) s="~${s#"$HOME"}" ;; esac
  [ ${#s} -gt 40 ] && s="…${s: -39}"
  printf '%s' "$s"
}

expand() { # leading ~ and relative paths to absolute
  local p=$1
  case $p in
    "~") p=$HOME ;;
    "~/"*) p="$HOME/${p#\~/}" ;;
  esac
  case $p in /*) ;; *) p="$PWD/$p" ;; esac
  printf '%s' "${p%/}"
}

# ---------- arguments ----------

TARGET_ARG='' YES=0 DRY=0 FORCE=0 MODE=install

while [ $# -gt 0 ]; do
  case $1 in
    -t | --target)
      [ $# -ge 2 ] || die "$1 needs a value, like --target claude" 2
      TARGET_ARG=$2
      shift
      ;;
    --target=*) TARGET_ARG=${1#*=} ;;
    -y | --yes) YES=1 ;;
    -n | --dry-run) DRY=1 ;;
    --force) FORCE=1 ;;
    --status) MODE=status ;;
    --uninstall) MODE=uninstall ;;
    -h | --help)
      usage
      exit 0
      ;;
    *) die "unknown option $1. See $PROG --help" 2 ;;
  esac
  shift
done

# ---------- skills ----------

SKILLS=()
for dir in "$REPO"/*/; do
  [ -f "$dir/SKILL.md" ] && SKILLS+=("$(basename "$dir")")
done
[ ${#SKILLS[@]} -gt 0 ] || die "no skills found in $REPO"

is_skill() {
  local s
  for s in "${SKILLS[@]}"; do [ "$s" = "$1" ] && return 0; done
  return 1
}

# ---------- targets ----------

T_NAME=() T_DEST=()

add_target() { # id or path
  local entry id name dest
  for entry in "${PROVIDERS[@]}"; do
    IFS='|' read -r id name dest _ _ <<<"$entry"
    if [ "$1" = "$id" ]; then
      T_NAME+=("$name")
      T_DEST+=("$dest")
      return 0
    fi
  done
  case $1 in
    */* | "~"* | .*)
      T_NAME+=("Custom")
      T_DEST+=("$(expand "$1")")
      ;;
    *) die "unknown target \"$1\". Use claude, agents, cursor, copilot or a path" 2 ;;
  esac
}

pick_targets() { # interactive menu
  local i=1 entry id name dest base note mark answer n count=${#PROVIDERS[@]} custom=$((${#PROVIDERS[@]} + 1))
  printf '\n  %s%s%s  %s%s skills in %s%s\n\n' "$B" "$(basename "$REPO")" "$R" "$DIM" "${#SKILLS[@]}" "$(short "$REPO")" "$R"
  printf '  Where should the skills be linked?\n'
  for entry in "${PROVIDERS[@]}"; do
    IFS='|' read -r id name dest base note <<<"$entry"
    mark=$(printf '%-17s %-20s' "$name" "$(short "$dest")")
    if [ -d "$base" ]; then
      mark="$mark ${OK}found${R}"
    elif [ -n "$note" ]; then
      mark="$mark      "
    fi
    [ -n "$note" ] && mark="$mark  ${DIM}${note}${R}"
    printf '    %s%d%s  %s\n' "$ACC" "$i" "$R" "${mark%"${mark##*[! ]}"}"
    i=$((i + 1))
  done
  printf '    %s%d%s  Custom path\n\n' "$ACC" "$custom" "$R"

  while :; do
    printf '  Choose one or more, like 1,2 %s[1]%s: ' "$DIM" "$R"
    read -r answer </dev/tty || exit 130
    [ -n "$answer" ] || answer=1
    T_NAME=() T_DEST=()
    for n in ${answer//,/ }; do
      case $n in
        *[!0-9]*) n=0 ;;
      esac
      if [ "$n" -ge 1 ] && [ "$n" -le "$count" ]; then
        IFS='|' read -r id _ <<<"${PROVIDERS[$((n - 1))]}"
        add_target "$id"
      elif [ "$n" -eq "$custom" ]; then
        printf '  Path: '
        read -r answer </dev/tty || exit 130
        [ -n "$answer" ] && T_NAME+=("Custom") && T_DEST+=("$(expand "$answer")")
      else
        T_NAME=()
        printf '  %sChoose numbers from 1 to %d.%s\n' "$WARN" "$custom" "$R"
        break
      fi
    done
    [ ${#T_NAME[@]} -gt 0 ] && break
  done
  printf '\n'
}

INTERACTIVE=0
[ -t 0 ] && [ -t 1 ] && INTERACTIVE=1

if [ -n "$TARGET_ARG" ]; then
  for t in ${TARGET_ARG//,/ }; do add_target "$t"; done
elif [ "$MODE" = status ]; then
  for entry in "${PROVIDERS[@]}"; do add_target "${entry%%|*}"; done
elif [ $INTERACTIVE = 1 ]; then
  pick_targets
else
  die "no terminal to ask in. Pass --target, like --target claude" 2
fi

# ---------- status ----------

points_here() { # link -> true when it points into this repo
  case $(readlink "$1") in "$REPO"/*) return 0 ;; esac
  return 1
}

if [ "$MODE" = status ]; then
  for i in "${!T_NAME[@]}"; do
    dest=${T_DEST[$i]}
    if [ ! -d "$dest" ] && [ ! -d "$(dirname "$dest")" ]; then
      printf '  %s%-17s%s %snot installed%s\n' "$B" "${T_NAME[$i]}" "$R" "$DIM" "$R"
      continue
    fi
    linked=0
    for s in "${SKILLS[@]}"; do
      [ -L "$dest/$s" ] && [ "$(readlink "$dest/$s")" = "$REPO/$s" ] && linked=$((linked + 1))
    done
    printf '  %s%-17s%s %d/%d linked  %s%s%s\n' "$B" "${T_NAME[$i]}" "$R" "$linked" "${#SKILLS[@]}" "$DIM" "$(short "$dest")" "$R"
  done
  exit 0
fi

# ---------- plan ----------

# One row per action: target index, kind, skill name, note
P_T=() P_KIND=() P_NAME=() P_NOTE=()
CHANGES=0

plan() { # target index, kind, name, note
  P_T+=("$1") P_KIND+=("$2") P_NAME+=("$3") P_NOTE+=("$4")
  case $2 in ok | skip) ;; *) CHANGES=$((CHANGES + 1)) ;; esac
}

for i in "${!T_DEST[@]}"; do
  dest=${T_DEST[$i]}
  if [ "$MODE" = uninstall ]; then
    for link in "$dest"/*; do
      [ -L "$link" ] && points_here "$link" && plan "$i" unlink "$(basename "$link")" ''
    done
    continue
  fi
  for s in "${SKILLS[@]}"; do
    link="$dest/$s"
    if [ -L "$link" ]; then
      current=$(readlink "$link")
      if [ "$current" = "$REPO/$s" ]; then
        plan "$i" ok "$s" ''
      else
        plan "$i" relink "$s" "was $(short "$current")"
      fi
    elif [ -e "$link" ]; then
      if [ $FORCE = 1 ]; then
        plan "$i" backup "$s" "moved to $s.bak-<date>"
      else
        plan "$i" skip "$s" "real folder there, use --force to back it up"
      fi
    else
      plan "$i" link "$s" ''
    fi
  done
  for link in "$dest"/*; do # links into this repo whose skill is gone
    [ -L "$link" ] && points_here "$link" && ! is_skill "$(basename "$link")" &&
      plan "$i" unlink "$(basename "$link")" 'skill no longer in the repo'
  done
done

label() { # kind -> colored "symbol word"
  case $1 in
    link) printf '%s+ link%s    ' "$OK" "$R" ;;
    relink) printf '%s~ relink%s  ' "$ACC" "$R" ;;
    backup) printf '%s> backup%s  ' "$WARN" "$R" ;;
    ok) printf '= ok      ' ;;
    skip) printf '%s! skip%s    ' "$WARN" "$R" ;;
    unlink) printf '%s- unlink%s  ' "$ERR" "$R" ;;
  esac
}

for i in "${!T_NAME[@]}"; do
  printf '  %s%s%s  %s%s%s\n' "$B" "${T_NAME[$i]}" "$R" "$DIM" "$(short "${T_DEST[$i]}")" "$R"
  shown=0
  for j in "${!P_T[@]}"; do
    [ "${P_T[$j]}" = "$i" ] || continue
    if [ -n "${P_NOTE[$j]}" ]; then
      printf '    %s%-20s %s%s%s\n' "$(label "${P_KIND[$j]}")" "${P_NAME[$j]}" "$DIM" "${P_NOTE[$j]}" "$R"
    else
      printf '    %s%s\n' "$(label "${P_KIND[$j]}")" "${P_NAME[$j]}"
    fi
    shown=1
  done
  [ $shown = 1 ] || printf '    %snothing linked from this repo%s\n' "$DIM" "$R"
  printf '\n'
done

if [ $CHANGES = 0 ]; then
  printf '  Nothing to change.\n'
  exit 0
fi
if [ $DRY = 1 ]; then
  printf '  Dry run: %d changes, nothing applied.\n' "$CHANGES"
  exit 0
fi
if [ $YES = 0 ]; then
  [ $INTERACTIVE = 1 ] || die "pass --yes to apply without a terminal" 2
  printf '  Apply %d changes? %s[y/N]%s ' "$CHANGES" "$DIM" "$R"
  read -r answer </dev/tty || exit 130
  case $answer in
    y | Y | yes | YES) printf '\n' ;;
    *)
      printf '  Nothing changed.\n'
      exit 0
      ;;
  esac
fi

# ---------- apply ----------

STAMP=$(date +%Y%m%d-%H%M%S)
FAILED=0
for i in "${!T_NAME[@]}"; do
  dest=${T_DEST[$i]}
  linked=0 relinked=0 backed=0 skipped=0 removed=0 failed=0
  for j in "${!P_T[@]}"; do
    [ "${P_T[$j]}" = "$i" ] || continue
    s=${P_NAME[$j]} link="$dest/${P_NAME[$j]}"
    case ${P_KIND[$j]} in
      link) mkdir -p "$dest" && ln -s "$REPO/$s" "$link" && linked=$((linked + 1)) || failed=$((failed + 1)) ;;
      relink) rm "$link" && ln -s "$REPO/$s" "$link" && relinked=$((relinked + 1)) || failed=$((failed + 1)) ;;
      backup) mv "$link" "$link.bak-$STAMP" && ln -s "$REPO/$s" "$link" && backed=$((backed + 1)) || failed=$((failed + 1)) ;;
      unlink) rm "$link" && removed=$((removed + 1)) || failed=$((failed + 1)) ;;
      skip) skipped=$((skipped + 1)) ;;
    esac
  done
  summary=''
  for pair in "$linked linked" "$relinked relinked" "$backed backed up" "$removed removed" "$skipped skipped" "$failed failed"; do
    [ "${pair%% *}" = 0 ] || summary="$summary, $pair"
  done
  summary=${summary#, }
  if [ $failed -gt 0 ]; then
    FAILED=1
    printf '  %sfailed%s  %-17s %s\n' "$ERR" "$R" "${T_NAME[$i]}" "${summary:-no changes}"
  else
    printf '  %sdone%s    %-17s %s\n' "$OK" "$R" "${T_NAME[$i]}" "${summary:-no changes}"
  fi
done
printf '  %sRestart open agent sessions to pick up the changes.%s\n' "$DIM" "$R"
exit $FAILED
