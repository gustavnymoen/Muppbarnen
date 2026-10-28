---
type: Guide
title: Administrationssidan
description: Så loggar du in som admin, väljer vem du är, ändrar storlekar och önskelistor och, som huvudadministratör, hanterar barn, föräldrar och bilder.
feature: MUPP-003
tags: [admin, önskelista, bilder]
---

# Administrationssidan

På administrationssidan fyller föräldrarna i barnens storlekar och önskelistor. Gustav, som är huvudadministratör, lägger också till föräldrar och barn och laddar upp barnens bilder. Du måste först ha kommit in på sajten med [sajtlösenordet](losenord.md).

## Logga in

1. Öppna menyn (knappen **Meny**) och välj **Admin**, längst ner. Det finns ingen annan länk dit.
2. Skriv **Adminlösenord** och tryck **Logga in**. Du förblir inloggad tills du stänger webbläsaren, högst åtta timmar.
3. Skriv du fel kommer "Fel lösenord." efter en sekund. Efter sex fel på 15 minuter från samma nätverk stängs inloggningen i 20 minuter: "För många försök. Försök igen om en stund."

Första gången, när det inte finns några föräldrar, visas **Skapa huvudadministratör** med namnet "Gustav" ifyllt. Ändra namnet om det ska vara ett annat och tryck **Skapa**. Det går bara att göra en gång.

## Välj vem du är

Du väljer själv bland föräldrarna med en knapp per förälder. Vem du är visas överst ("Barn som tillhör …"). **Byt förälder** tar dig tillbaka till listan. Ingen förälder har eget lösenord, så var rädd om adminlösenordet.

## Små kort och ikoner

Allt i admin är smala kort som är hopfällda när sidan öppnas. Knapparna är små ikoner; håll musen över en ikon (eller läs med skärmläsare) för att se vad den gör:

| Ikon | Namn | Gör |
|---|---|---|
| Penna | **Ändra …** | Fäller ut kortet med information och formulär. Tryck igen, eller **Esc**, för att fälla ihop det. |
| Papperskorg | **Ta bort …** | Frågar först och nämner vad som tas bort. |
| Bild | **Bild för …** | Öppnar bilden (bara huvudadministratören). |
| Måttband | **Storlekar för …** | Öppnar en sida med bara barnets storlekar. |
| Checklista | **Önskelistor för …** | Öppnar en sida med bara barnets önskelistor. |

Bara ett kort är utfällt åt gången: öppnar du ett annat fälls det första ihop. När du sparat fälls kortet ihop av sig självt. Blir det fel stannar kortet öppet med felet vid fältet.

## Storlekar

1. På din sida finns ett smalt kort per barn. Tryck måttbandet **Storlekar för …**. Sidan har bara storlekarna.
2. Skriv storlek för kläder, skor, huvud och handskar (högst 40 tecken vardera, tomt tar bort storleken) och tryck **Spara**. Det står "Sparat." när det gick bra.

## Önskelistor

Tryck checklistan **Önskelistor för …** vid barnet: sidan har bara önskelistorna. Varje barn har två listor, **Födelsedag** och **Jul**.

- **Lägg till:** tryck **Ny önskning**, fyll i **Namn** (måste finnas), och om du vill **Storlek**, **Beskrivning** och **Länk** (börjar med http:// eller https://). Kryssa i **Obegränsad** om flera får ge samma sak, annars kan önskningen paxas en gång. Tryck **Lägg till**.
- **Se mer och ändra:** tryck pennan **Ändra …** vid önskningen. Då syns storlek, beskrivning och länk, och formuläret. Ändra och tryck **Spara**.
- **Ta bort:** tryck papperskorgen **Ta bort …**. Du får en fråga som nämner önskningen; svara **Ta bort** eller **Avbryt**.
- **Töm listan:** papperskorgen vid rubriken tar bort alla önskningar i en lista, efter en fråga som nämner listan och barnet.

Fel visas bredvid fältet, och det du skrivit finns kvar så att du kan rätta det.

## Hantera (bara huvudadministratören)

Om du är huvudadministratör finns **Hantera** på din sida, med knappen **Hantera barn och föräldrar**. Där finns rubrikerna **Föräldrar** och **Barn**, med ett smalt kort för var och en.

- **Föräldrar:** lägg till, ändra namn, kryssa i **Huvudadministratör**, eller ta bort. En förälder som har barn kan inte tas bort: flytta eller ta bort barnen först. Det måste alltid finnas minst en huvudadministratör.
- **Barn:** lägg till med **Nytt barn**: namn, födelsedatum (ett riktigt datum som inte är i framtiden) och förälder. Pennan visar bilden, födelsedatum och förälder och låter dig ändra, bland annat byta förälder. Papperskorgen tar också bort barnets listor och bild, efter en fråga.
- **Bild:** tryck bildikonen **Bild för …** vid barnet, välj en fil (JPEG, PNG eller WebP, högst 4 MB) och tryck **Spara bild**. En ny bild ersätter den gamla. Annat ger "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB."
- **Ta bort bilden:** har barnet en bild visas en rad "Bild" med en papperskorg överst i bildpanelen (**Ta bort bilden för …**). Du får en fråga som nämner barnet; efter **Ta bort** visas barnets initial i stället.

Bilderna syns bara för den som är inne på sajten med sajtlösenordet.

## Byta adminlösenord (för den som sköter sajten)

Lösenordet och nyckeln som signerar inloggningen är inställningarna `ADMIN_PASSWORD` och `ADMIN_SESSION_SECRET` i Vercel (Production och Preview) och i `.env.local`. Byt värdet och publicera om sajten; byter du nyckeln loggas alla ut. Saknas någon av dem är admin stängd.

Byggd av [MUPP-003](../../specs/MUPP-003-admin-page/solution.md) och [MUPP-010](../../specs/MUPP-010-compact-admin/solution.md); den tekniska beskrivningen är [Admin page](../system/admin.md).

[Manual](index.md)
