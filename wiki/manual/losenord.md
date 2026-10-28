---
type: Guide
title: Lösenordet till sajten
description: Så kommer du in på sajten med lösenordet, vad som händer om du skriver fel och hur du byter lösenord.
feature: MUPP-009
tags: [lösenord, inloggning]
---

# Lösenordet till sajten

Hela sajten ligger bakom ett gemensamt lösenord, så att bara familj och vänner som har det kan se barnen, bilderna och önskelistorna.

## Komma in

1. Öppna sajten. Har du inte skrivit in lösenordet förut kommer du till en sida med sajtens namn och ett fält som heter **Lösenord**.
2. Skriv lösenordet och tryck **Öppna**.
3. Du kommer till den sida du ville till. Sajten kommer ihåg dig i 180 dagar på den enheten och webbläsaren, så du behöver inte skriva det igen.

Det finns ingen knapp för att logga ut. Vill du bli utloggad rensar du webbläsarens cookies för sajten.

## Om det inte går

- **"Fel lösenord."** Svaret kommer efter ungefär en sekund. Kontrollera stora och små bokstäver och försök igen.
- **"För många försök. Försök igen om en stund."** Efter fem försök på 15 minuter från samma nätverk stängs det en stund, också för rätt lösenord. Vänta en kvart och försök igen.

## Byta lösenord (för den som sköter sajten)

Lösenordet och nyckeln som signerar inloggningen är inställningarna `SITE_PASSWORD` och `SITE_SESSION_SECRET` under Settings → Environment Variables i Vercel (både Production och Preview), och i `.env.local` på datorn. Byt värdet och publicera om sajten. Byter du `SITE_SESSION_SECRET` loggas alla ut och måste skriva lösenordet igen. Saknas någon av dem är sajten stängd för alla.

Byggd av [MUPP-009](../../specs/MUPP-009-site-password/solution.md); den tekniska beskrivningen är [Site password](../system/site-password.md).

[Manual](index.md)
