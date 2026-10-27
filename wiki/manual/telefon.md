---
type: Guide
title: Titta på sajten på telefonen
description: "Så ser du en ny version av sajten på telefonen innan den är publicerad, och var stilguiden finns."
feature: MUPP-001
tags: [manual, telefon]
---

# Titta på sajten på telefonen

De flesta besökare använder telefonen, så en ny version bör ses där innan den publiceras.

## Förhandsversionen

1. Öppna pull requesten på GitHub och klicka på länken till Vercels förhandsversion (under kontrollerna, "Vercel").
2. Vercel ber om inloggning första gången: logga in med GitHub-kontot som äger projektet.
3. Sidan öppnas med `https://` och utan varning om certifikat.

## Stilguiden

Sidan `/design` (till exempel `https://muppbarnen.vercel.app/design`) visar alla färger, texter och komponenter med påhittade barn. Använd den för att bedöma looken i telefonen: bläddra, tryck på knapparna och kortet, och prova att vrida telefonen.

## Lokalt på datorn

`npm run dev:https` startar sajten på `https://localhost:3000`. Första gången behöver datorn `mkcert` (se [Testing on a phone](../system/phone-testing.md)). För telefonen är förhandsversionen enklare.

[Manual](index.md)
