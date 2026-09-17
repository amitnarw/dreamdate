#!/usr/bin/env node
/* Hinglish rewrite pass: replace broken phrases with natural texting.
 * Idempotent.
 */
const fs = require('fs');
const path = require('path');

const TARGETS = [
  'src/data/conversationCorpus.ts',
  'src/services/chatEngine.ts',
  'src/services/personaEngine.ts',
];

const REPLACEMENTS = [
  // "handi karungi" — invented phrase, replace with believable
  ["main bhi handi karungi", "sab kuch kar lungi"],
  ["sab karungi me", "sab kuch kar lungi"],
  ["main $1 handi karungi", "main $1 kar lungi"],

  // "ram ram" as flirty interjection — replace with natural Hinglish
  ["ram ram, kya kar rahe ho ☝️🙈 saath me?", "kya kar rahe ho ☝️🙈 saath me?"],
  ["ram ram, aaj toh mood bana ke rakha hai 😏", "aaj mood bana ke rakha hai 😏"],
  ["ram ram, aap bhi bold ho 🔥", "aap bhi aaj bold ho 🔥"],
  ["ram ram 😏, tum bhi na", "tum bhi na 😏"],
  ["ram ram 🌙, tum bhi entry", "tum bhi aise hi 🌙"],
  ["ram ram 🔥, tum bhi na aaj", "tum bhi na aaj 🔥"],
  ["ram ram 😏, aaj toh dumdaar", "aaj toh kya kya 😏"],
  ["ram ram 🌙, tum bhi entry", "tum bhi aise hi 🌙"],
  ["ram ram, aaj toh dumdaar entry 😜", "aaj toh kya baat kar rahe ho 😜"],
  ["ram ram, entry ke phekad 🙈", "entry leke kya karoge 🙈"],

  // "dumdaar" — Hinglish slang but overused ; replace tasteful variants
  ["haww, sawaal toh dumdaar hai 😏", "haww, sawaal toh achha hai 😏"],
  ["ye sawaal 😏 toh dumdaar hai baba", "ye sawaal 😏 achha hai baba"],
  ["aaj toh dumdaar", "aaj toh kya kya"],

  // "entry" lines in dirty_tease / dirty_deflect — rework
  ["wow 😏 aaj toh entry maar di", "wow 😏 aaj toh kya baat"],
  ["tum bhi na, har baar entry 🙈", "tum bhi na, har baar aise hi 🙈"],
  ["achha chalo 😏 tumhari entry ka kya karu?", "achha chalo 😏 suno ab"],
  ["haww 😏 aaj toh entry maza aa gaya", "haww 😏 aaj toh maza aa gaya"],
  ["tum bhi na, har baar entry mare ho 🙈", "tum bhi na, har baar aise hi 🙈"],
  ["haww 🌸, aap bhi na, har baar entry", "haww 🌸, aap bhi na, har baar aise hi"],
  ["tum bhi baba 😏, har baar entry", "tum bhi baba 😏, har baar aise hi"],

  // Opposite-meaning line fix
  ["tumse baat karke mera mood kharab hi ho jata hai 😏", "tumse baat karke mera mood achha ho jata hai 😏"],

  // "so cho sawaal" — nonsense ; replace with natural Hindi
  ["aur kuch puchoge? so cho sawaal", "aur kya sawaal hai?"],

  // Mock profiles suarwy → sweet (Chandigarh ki sweet girl)
];

let totalEdited = 0;
for (const f of TARGETS) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const [needle, replacement] of REPLACEMENTS) {
    if (typeof needle === 'string') {
      const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      s = s.replace(re, () => { count++; return replacement; });
    } else {
      s = s.replace(needle, () => { count++; return replacement; });
    }
  }
  if (count > 0) {
    fs.writeFileSync(p, s, 'utf8');
    console.log(`${f}: ${count} replacements`);
    totalEdited += count;
  }
}
console.log(`done — ${totalEdited} total replacements`);
