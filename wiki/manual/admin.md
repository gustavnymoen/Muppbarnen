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

## Storlekar

1. På din sida finns ett kort per barn. Tryck **Önskelistor och storlekar**.
2. Skriv storlek för kläder, skor, huvud och handskar (högst 40 tecken vardera, tomt tar bort storleken) och tryck **Spara**. Det står "Sparat." när det gick bra.

## Önskelistor

Varje barn har två listor, **Födelsedag** och **Jul**.

- **Lägg till:** tryck **Ny önskning**, fyll i **Namn** (måste finnas), och om du vill **Storlek**, **Beskrivning** och **Länk** (börjar med http:// eller https://). Kryssa i **Obegränsad** om flera får ge samma sak, annars kan önskningen paxas en gång. Tryck **Lägg till**.
- **Ändra:** tryck **Ändra** vid önskningen, ändra och tryck **Spara**.
- **Ta bort:** tryck **Ta bort**. Du får en fråga som nämner önskningen; svara **Ta bort** eller **Avbryt**.
- **Töm listan:** tar bort alla önskningar i en lista, efter en fråga som nämner listan och barnet.

Fel visas bredvid fältet, och det du skrivit finns kvar så att du kan rätta det.

## Hantera (bara huvudadministratören)

Om du är huvudadministratör finns kortet **Hantera** på din sida, med knappen **Hantera barn och föräldrar**.

- **Föräldrar:** lägg till, ändra namn, kryssa i **Huvudadministratör**, eller ta bort. En förälder som har barn kan inte tas bort: flytta eller ta bort barnen först. Det måste alltid finnas minst en huvudadministratör.
- **Barn:** lägg till med namn, födelsedatum (ett riktigt datum som inte är i framtiden) och förälder. Under **Ändra** byter du förälder. **Ta bort** tar också bort barnets listor och bild, efter en fråga.
- **Bild:** tryck **Bild** vid barnet, välj en fil (JPEG, PNG eller WebP, högst 4 MB) och tryck **Spara bild**. En ny bild ersätter den gamla. Annat ger "Bilden måste vara JPEG, PNG eller WebP och högst 4 MB."

Bilderna syns bara för den som är inne på sajten med sajtlösenordet.

## Byta adminlösenord (för den som sköter sajten)

Lösenordet och nyckeln som signerar inloggningen är inställningarna `ADMIN_PASSWORD` och `ADMIN_SESSION_SECRET` i Vercel (Production och Preview) och i `.env.local`. Byt värdet och publicera om sajten; byter du nyckeln loggas alla ut. Saknas någon av dem är admin stängd.

Byggd av [MUPP-003](../../specs/MUPP-003-admin-page/solution.md); den tekniska beskrivningen är [Admin page](../system/admin.md).

[Manual](index.md)
