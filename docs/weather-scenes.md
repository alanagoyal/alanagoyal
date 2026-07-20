# Weather Scenes

This document explains how the weather app's backgrounds and animations are structured.

## Files

| path | responsibility |
|------|----------------|
| `lib/weather.ts` | maps weather codes to moods, chooses time-of-day themes, and assigns effect sets |
| `components/apps/weather/weather-scene-effects.tsx` | shared scene renderer used by the weather app and notification center |
| `components/apps/weather/weather-app.tsx` | weather app UI, forecast data fetching, sidebar cards, and preview controls |
| `app/globals.css` | animation primitives for rain, snow, fog, clouds, and lightning |

## Scene Model

`getWeatherScene()` in `lib/weather.ts` returns a `WeatherScene` with:

- `background`: the scene backdrop for the current phase and mood
- `heroGradient`: the foreground card gradient used in the main weather view
- `sidebarShellBackground`: the sidebar shell background image
- `cloudTone`: selects the cloud color treatment
- `mainEffects`: effect list for the live main scene
- `previewEffects`: effect list for static previews like sidebar cards and the notification widget

The renderer intentionally distinguishes between `main` and `preview` surfaces:

- `main`: animated, full-scene treatment
- `preview`: static stills that should visually match the main scene without motion

## Theme Organization

Themes are grouped by mood, then by day phase, in `lib/weather.ts`.

Use this when changing color:

- tweak `CLEAR_THEMES`, `CLOUDY_THEMES`, `FOG_THEMES`, `RAIN_THEMES`, `SNOW_THEMES`, or `THUNDER_THEMES` for palette changes
- prefer sharing phase backgrounds explicitly when two moods should match
- keep animation changes out of the theme table

## Effect Organization

`getWeatherSurfaceEffects()` decides which effect set a mood receives.

Current high-level rules:

- `thunder`: rain plus lightning
- `rain`: same rain treatment as thunder without lightning
- `fog`: fog overlays, with motion only on the main surface
- `cloudy`: cloud shade and cloud drift on the main surface
- `snow`: snow particles, with extra cloud bands during dawn and dusk

## Tuning Guide

For common tweaks:

- darken or lighten a weather type: update the mood theme map in `lib/weather.ts`
- increase rain density: edit the rain drop datasets in `weather-scene-effects.tsx`
- increase snow density: edit `WEATHER_SNOW_FLAKES` in `weather-scene-effects.tsx`
- change preview still composition: edit preview-specific branches in `weather-scene-effects.tsx`
- change motion speed: edit the particle datasets or the keyframes in `app/globals.css`

## Preview Notes

Preview rain is not separately designed; it is a deterministic freeze-frame of the live rain layout so preview cards stay visually aligned with the main scene.

If you change rain geometry or timing, verify:

- main weather scene
- weather sidebar cards
- notification center weather widget
- preview controls in the weather app
