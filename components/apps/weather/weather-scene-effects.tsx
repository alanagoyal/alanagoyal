"use client";

import { type CSSProperties } from "react";
import { type WeatherScene } from "@/lib/weather";
import { cn } from "@/lib/utils";

export type WeatherSceneSurface = "main" | "preview";

const CLOUD_BAND_TONES: Record<WeatherScene["cloudTone"], [string, string, string]> = {
  storm: ["bg-slate-200/[0.14]", "bg-slate-100/10", "bg-slate-100/[0.08]"],
  fog: ["bg-slate-100/[0.18]", "bg-slate-100/[0.16]", "bg-slate-100/[0.2]"],
  cloudy: ["bg-white/[0.34]", "bg-white/[0.28]", "bg-white/[0.24]"],
  default: ["bg-white/16", "bg-white/14", "bg-white/12"],
};

const WEATHER_RAIN_DROPS = [
  { left: "4%", top: "-18%", height: 16, duration: 1.2, delay: 0.1, drift: 4, opacity: 0.5 },
  { left: "9%", top: "-8%", height: 18, duration: 1.4, delay: 0.8, drift: 6, opacity: 0.42 },
  { left: "14%", top: "-22%", height: 14, duration: 1.05, delay: 0.2, drift: 5, opacity: 0.58 },
  { left: "18%", top: "-12%", height: 20, duration: 1.35, delay: 1.1, drift: 7, opacity: 0.46 },
  { left: "23%", top: "-26%", height: 15, duration: 1.1, delay: 0.4, drift: 5, opacity: 0.54 },
  { left: "28%", top: "-10%", height: 17, duration: 1.25, delay: 1.4, drift: 6, opacity: 0.44 },
  { left: "33%", top: "-20%", height: 19, duration: 1.45, delay: 0.7, drift: 8, opacity: 0.4 },
  { left: "38%", top: "-14%", height: 13, duration: 0.95, delay: 0.3, drift: 4, opacity: 0.6 },
  { left: "43%", top: "-24%", height: 18, duration: 1.2, delay: 1.6, drift: 6, opacity: 0.48 },
  { left: "48%", top: "-9%", height: 16, duration: 1.15, delay: 0.5, drift: 5, opacity: 0.56 },
  { left: "53%", top: "-19%", height: 21, duration: 1.5, delay: 1.3, drift: 7, opacity: 0.38 },
  { left: "58%", top: "-6%", height: 14, duration: 1.05, delay: 0.9, drift: 4, opacity: 0.58 },
  { left: "63%", top: "-21%", height: 18, duration: 1.25, delay: 0.15, drift: 6, opacity: 0.5 },
  { left: "68%", top: "-13%", height: 15, duration: 1.1, delay: 1.0, drift: 5, opacity: 0.6 },
  { left: "73%", top: "-25%", height: 20, duration: 1.4, delay: 0.55, drift: 7, opacity: 0.42 },
  { left: "78%", top: "-11%", height: 14, duration: 1.0, delay: 1.55, drift: 4, opacity: 0.62 },
  { left: "83%", top: "-23%", height: 17, duration: 1.2, delay: 0.35, drift: 5, opacity: 0.54 },
  { left: "88%", top: "-7%", height: 19, duration: 1.35, delay: 1.25, drift: 7, opacity: 0.44 },
  { left: "93%", top: "-18%", height: 15, duration: 1.1, delay: 0.65, drift: 5, opacity: 0.58 },
] as const;

const WEATHER_THUNDER_EXTRA_RAIN_DROPS = [
  { left: "7%", top: "-24%", height: 15, duration: 1.18, delay: 0.45, drift: 5, opacity: 0.46 },
  { left: "16%", top: "-6%", height: 17, duration: 1.28, delay: 1.05, drift: 6, opacity: 0.42 },
  { left: "26%", top: "-18%", height: 16, duration: 1.08, delay: 0.25, drift: 5, opacity: 0.54 },
  { left: "36%", top: "-8%", height: 18, duration: 1.34, delay: 1.45, drift: 7, opacity: 0.4 },
  { left: "46%", top: "-22%", height: 14, duration: 1.02, delay: 0.72, drift: 4, opacity: 0.58 },
  { left: "57%", top: "-12%", height: 19, duration: 1.22, delay: 0.18, drift: 6, opacity: 0.48 },
  { left: "67%", top: "-26%", height: 15, duration: 1.38, delay: 1.18, drift: 7, opacity: 0.41 },
  { left: "76%", top: "-9%", height: 17, duration: 1.12, delay: 0.62, drift: 5, opacity: 0.56 },
  { left: "86%", top: "-20%", height: 16, duration: 1.3, delay: 1.52, drift: 6, opacity: 0.43 },
  { left: "97%", top: "-11%", height: 14, duration: 1.06, delay: 0.38, drift: 4, opacity: 0.6 },
] as const;

const WEATHER_SNOW_FLAKES = [
  { left: "6%", top: "-8%", size: 5, duration: 5.8, delay: 0.3, drift: 12, opacity: 0.78 },
  { left: "14%", top: "-18%", size: 6, duration: 6.4, delay: 1.2, drift: 14, opacity: 0.72 },
  { left: "21%", top: "-10%", size: 4, duration: 5.2, delay: 0.7, drift: 10, opacity: 0.82 },
  { left: "25%", top: "-5%", size: 5, duration: 5.7, delay: 1.6, drift: 11, opacity: 0.76 },
  { left: "27%", top: "-28%", size: 4, duration: 5.4, delay: 2.2, drift: 10, opacity: 0.8 },
  { left: "29%", top: "-20%", size: 7, duration: 7.1, delay: 1.8, drift: 16, opacity: 0.68 },
  { left: "34%", top: "-26%", size: 4, duration: 5.1, delay: 2.3, drift: 9, opacity: 0.84 },
  { left: "38%", top: "-14%", size: 5, duration: 6.2, delay: 0.1, drift: 13, opacity: 0.8 },
  { left: "42%", top: "-4%", size: 6, duration: 6.6, delay: 1.0, drift: 15, opacity: 0.7 },
  { left: "44%", top: "-19%", size: 5, duration: 5.8, delay: 2.7, drift: 13, opacity: 0.76 },
  { left: "47%", top: "-6%", size: 6, duration: 5.6, delay: 2.1, drift: 11, opacity: 0.74 },
  { left: "51%", top: "-24%", size: 5, duration: 6.0, delay: 0.8, drift: 12, opacity: 0.79 },
  { left: "55%", top: "-16%", size: 4, duration: 4.9, delay: 1.4, drift: 9, opacity: 0.84 },
  { left: "58%", top: "-27%", size: 6, duration: 7.0, delay: 0.55, drift: 15, opacity: 0.71 },
  { left: "60%", top: "-7%", size: 6, duration: 6.9, delay: 2.4, drift: 16, opacity: 0.69 },
  { left: "64%", top: "-12%", size: 7, duration: 7.4, delay: 0.9, drift: 17, opacity: 0.7 },
  { left: "69%", top: "-19%", size: 4, duration: 5.3, delay: 1.5, drift: 10, opacity: 0.82 },
  { left: "71%", top: "-3%", size: 5, duration: 6.4, delay: 2.9, drift: 12, opacity: 0.75 },
  { left: "73%", top: "-22%", size: 5, duration: 6.1, delay: 2.6, drift: 12, opacity: 0.78 },
  { left: "77%", top: "-11%", size: 5, duration: 5.9, delay: 0.4, drift: 13, opacity: 0.77 },
  { left: "82%", top: "-9%", size: 6, duration: 5.4, delay: 1.7, drift: 14, opacity: 0.76 },
  { left: "84%", top: "-29%", size: 4, duration: 5.2, delay: 1.1, drift: 9, opacity: 0.82 },
  { left: "86%", top: "-23%", size: 4, duration: 5.0, delay: 2.0, drift: 9, opacity: 0.83 },
  { left: "91%", top: "-18%", size: 4, duration: 4.8, delay: 0.5, drift: 10, opacity: 0.82 },
  { left: "93%", top: "-28%", size: 6, duration: 6.7, delay: 2.5, drift: 14, opacity: 0.72 },
  { left: "95%", top: "-6%", size: 5, duration: 6.3, delay: 1.3, drift: 12, opacity: 0.75 },
] as const;

const WEATHER_LIGHTNING_BOLTS = [
  {
    left: "61%",
    top: "10%",
    width: "40px",
    height: "20%",
    delay: "0s",
    clipPath:
      "polygon(48% 0%, 68% 0%, 56% 34%, 72% 34%, 38% 68%, 52% 68%, 28% 100%, 40% 62%, 24% 62%)",
  },
  {
    left: "69%",
    top: "14%",
    width: "32px",
    height: "15%",
    delay: "0.16s",
    clipPath:
      "polygon(44% 0%, 66% 0%, 54% 38%, 72% 38%, 34% 100%, 46% 62%, 26% 62%)",
  },
  {
    left: "74%",
    top: "8%",
    width: "28px",
    height: "12%",
    delay: "2.7s",
    clipPath:
      "polygon(46% 0%, 64% 0%, 54% 34%, 70% 34%, 36% 100%, 46% 64%, 28% 64%)",
  },
] as const;

const WEATHER_PREVIEW_RAIN_FREEZE_TIME = 4.6;

function freezeRainDropsForPreview<
  T extends readonly {
    left: string;
    top: string;
    height: number;
    duration: number;
    delay: number;
    drift: number;
    opacity: number;
  }[],
>(drops: T) {
  return drops.map((drop, index) => {
    const cycleTime = WEATHER_PREVIEW_RAIN_FREEZE_TIME + index * 0.08;
    const progress =
      (((cycleTime - drop.delay) % drop.duration) + drop.duration) % drop.duration / drop.duration;
    const startTop = Number.parseFloat(drop.top);

    return {
      ...drop,
      top: `${startTop + progress * 126}%`,
      drift: Number((drop.drift * progress).toFixed(2)),
      height: Math.max(9, Math.round(drop.height * (0.78 + progress * 0.16))),
      opacity: Number(Math.min(0.74, drop.opacity + 0.04 + progress * 0.08).toFixed(2)),
    };
  });
}

// Preview stills reuse the live rain layout but freeze it at a deterministic moment.
const WEATHER_PREVIEW_RAIN_DROPS = freezeRainDropsForPreview(WEATHER_RAIN_DROPS);
const WEATHER_PREVIEW_THUNDER_RAIN_DROPS = freezeRainDropsForPreview(WEATHER_THUNDER_EXTRA_RAIN_DROPS);

export function WeatherSceneEffects({
  scene,
  surface,
}: {
  scene: WeatherScene;
  surface: WeatherSceneSurface;
}) {
  const effects = surface === "main" ? scene.mainEffects : scene.previewEffects;
  const cloudClasses = CLOUD_BAND_TONES[scene.cloudTone];
  const hasEffect = (effect: WeatherScene["mainEffects"][number]) => effects.includes(effect);
  const isPreview = surface === "preview";
  const isThunderScene = scene.mood === "thunder";
  const isAnimatedCloudyMain = hasEffect("cloudDrift") && !isPreview;
  const isAnimatedFogMain = hasEffect("fogDrift") && !isPreview;

  return (
    <div className="pointer-events-none absolute inset-0">
      {isPreview && (
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,16,34,0.18)_0%,rgba(8,16,34,0.34)_100%)]" />
      )}

      {hasEffect("cloudShade") && (
        <div
          className="absolute inset-0"
          style={{
            background: isPreview
              ? scene.cloudTone === "fog"
                ? "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(186,203,220,0.24) 100%)"
                : "linear-gradient(180deg, rgba(10,18,34,0.18) 0%, rgba(10,18,34,0.36) 100%)"
              : scene.cloudTone === "fog"
                ? "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(186,203,220,0.18) 100%)"
                : "linear-gradient(180deg, rgba(12,20,34,0.10) 0%, rgba(12,20,34,0.22) 100%)",
          }}
        />
      )}

      {hasEffect("cloudDrift") && !isPreview && (
        <div
          className="weather-cloud-pan absolute left-[-30%] top-[14%] h-44 w-[58rem] opacity-90"
          style={
            {
              ["--cloud-pan-distance" as string]: "42%",
              ["--cloud-pan-duration" as string]: "12s",
              animationDelay: "-2s",
            } as CSSProperties
          }
        >
          <div className="absolute left-[2%] top-[34%] h-20 w-56 rounded-full bg-white/24 blur-xl" />
          <div className="absolute left-[14%] top-[14%] h-28 w-72 rounded-full bg-white/30 blur-xl" />
          <div className="absolute left-[31%] top-[6%] h-32 w-80 rounded-full bg-white/34 blur-xl" />
          <div className="absolute left-[50%] top-[18%] h-30 w-72 rounded-full bg-white/28 blur-xl" />
          <div className="absolute left-[68%] top-[28%] h-24 w-64 rounded-full bg-white/22 blur-xl" />
          <div className="absolute left-[12%] top-[44%] h-18 w-[76%] rounded-full bg-white/18 blur-2xl" />
        </div>
      )}

      {hasEffect("sunGlow") && (
        isPreview ? (
          <div className="absolute right-[8%] top-[8%] h-20 w-20 rounded-full bg-yellow-100/18 blur-2xl" />
        ) : (
          <>
            <div className="absolute -top-14 right-[16%] h-52 w-52 rounded-full bg-yellow-100/18 blur-3xl" />
            <div className="absolute top-4 right-[22%] h-24 w-24 rounded-full bg-yellow-200/30 blur-2xl" />
          </>
        )
      )}

      {hasEffect("stars") && (
        <div
          className={cn("absolute inset-0", isPreview ? "opacity-68" : "opacity-75")}
          style={{
            backgroundImage: isPreview
              ? "radial-gradient(1.6px 1.6px at 18px 18px, rgba(255,255,255,0.78), transparent 60%), radial-gradient(1.3px 1.3px at 78px 34px, rgba(255,255,255,0.68), transparent 60%), radial-gradient(1.2px 1.2px at 138px 22px, rgba(255,255,255,0.62), transparent 60%)"
              : "radial-gradient(2px 2px at 12px 18px, rgba(255,255,255,0.95), transparent 60%), radial-gradient(1.5px 1.5px at 52px 36px, rgba(255,255,255,0.85), transparent 60%), radial-gradient(2px 2px at 98px 62px, rgba(255,255,255,0.9), transparent 60%), radial-gradient(1.5px 1.5px at 154px 28px, rgba(255,255,255,0.8), transparent 60%)",
            backgroundSize: isPreview ? "160px 90px" : "180px 120px",
          }}
        />
      )}

      {hasEffect("cloudBands") && (
        <>
          <div
            className={cn(
              "absolute rounded-full",
              isPreview
                ? "left-[10%] top-[14%] h-10 w-28 blur-2xl"
                : isAnimatedCloudyMain
                  ? "left-[6%] top-[8%] h-36 w-[34rem] blur-3xl"
                  : "left-[14%] top-[12%] h-24 w-80 blur-3xl",
              isAnimatedCloudyMain && "weather-cloud-drift",
              cloudClasses[0]
            )}
            style={
              isAnimatedCloudyMain
                ? ({
                    ["--cloud-drift-x" as string]: "88px",
                    ["--cloud-drift-y" as string]: "12px",
                    ["--cloud-drift-duration" as string]: "18s",
                    animationDelay: "-3s",
                  } as CSSProperties)
                : undefined
            }
          />
          <div
            className={cn(
              "absolute rounded-full",
              isPreview
                ? "right-[6%] top-[26%] h-9 w-24 blur-2xl"
                : isAnimatedCloudyMain
                  ? "right-[-4%] top-[20%] h-32 w-[28rem] blur-3xl"
                  : "right-[6%] top-[26%] h-20 w-72 blur-3xl",
              isAnimatedCloudyMain && "weather-cloud-drift",
              cloudClasses[1]
            )}
            style={
              isAnimatedCloudyMain
                ? ({
                    ["--cloud-drift-x" as string]: "-72px",
                    ["--cloud-drift-y" as string]: "16px",
                    ["--cloud-drift-duration" as string]: "22s",
                    animationDelay: "-8s",
                  } as CSSProperties)
                : undefined
            }
          />
          <div
            className={cn(
              "absolute rounded-full",
              isPreview
                ? "left-[26%] bottom-[18%] h-10 w-32 blur-2xl"
                : isAnimatedCloudyMain
                  ? "left-[18%] bottom-[16%] h-32 w-[40rem] blur-3xl"
                  : "left-[32%] bottom-[24%] h-24 w-96 blur-3xl",
              isAnimatedCloudyMain && "weather-cloud-drift",
              cloudClasses[2]
            )}
            style={
              isAnimatedCloudyMain
                ? ({
                    ["--cloud-drift-x" as string]: "54px",
                    ["--cloud-drift-y" as string]: "-10px",
                    ["--cloud-drift-duration" as string]: "20s",
                    animationDelay: "-12s",
                  } as CSSProperties)
                : undefined
            }
          />
        </>
      )}

      {hasEffect("fog") && (
        isPreview ? (
          <>
            <div className="absolute inset-x-[4%] top-[20%] h-10 rounded-full bg-white/14 blur-2xl" />
            <div className="absolute inset-x-0 bottom-[8%] h-12 bg-white/20 blur-2xl" />
            <div className="absolute inset-x-0 bottom-0 h-16 bg-white/26 blur-3xl" />
          </>
        ) : (
          <>
            {isAnimatedFogMain && (
              <>
                <div
                  className="weather-fog-pan absolute left-[-18%] top-[18%] h-28 w-[70%] rounded-full bg-white/18 blur-3xl"
                  style={
                    {
                      ["--fog-pan-distance" as string]: "16%",
                      ["--fog-pan-duration" as string]: "18s",
                      animationDelay: "-4s",
                    } as CSSProperties
                  }
                />
                <div
                  className="weather-fog-pan absolute right-[-16%] top-[40%] h-24 w-[64%] rounded-full bg-white/14 blur-3xl"
                  style={
                    {
                      ["--fog-pan-distance" as string]: "-14%",
                      ["--fog-pan-duration" as string]: "22s",
                      animationDelay: "-10s",
                    } as CSSProperties
                  }
                />
              </>
            )}
            <div className="absolute inset-x-[6%] top-[22%] h-28 rounded-full bg-white/12 blur-3xl" />
            <div className="absolute inset-x-[2%] top-[46%] h-28 rounded-full bg-white/16 blur-3xl" />
            <div className="absolute inset-x-0 bottom-[10%] h-36 bg-white/22 blur-2xl" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-white/30 blur-3xl" />
          </>
        )
      )}

      {hasEffect("rainDrops") && (
        <div className="absolute inset-0 overflow-hidden">
          {(isPreview ? WEATHER_PREVIEW_RAIN_DROPS : WEATHER_RAIN_DROPS).map((drop, index) => (
            <div
              key={`${drop.left}-${index}`}
              className={cn("absolute rounded-full", !isPreview && "weather-rain-drop")}
              style={{
                left: drop.left,
                top: drop.top,
                width: "2px",
                height: `${drop.height}px`,
                opacity: drop.opacity,
                background:
                  "linear-gradient(180deg, rgba(236,244,255,0) 0%, rgba(236,244,255,0.92) 38%, rgba(173,205,255,0.92) 100%)",
                boxShadow: isPreview
                  ? "0 0 4px rgba(196,220,255,0.14)"
                  : "0 0 6px rgba(196,220,255,0.18)",
                transform: isPreview ? `translateX(${drop.drift}px)` : undefined,
                ["--rain-duration" as string]: isPreview ? undefined : `${drop.duration}s`,
                ["--rain-delay" as string]: isPreview ? undefined : `${drop.delay}s`,
                ["--rain-drift" as string]: isPreview ? undefined : `${drop.drift}px`,
              }}
            />
          ))}
          {isThunderScene &&
            (isPreview ? WEATHER_PREVIEW_THUNDER_RAIN_DROPS : WEATHER_THUNDER_EXTRA_RAIN_DROPS).map(
              (drop, index) => (
                <div
                  key={`thunder-${drop.left}-${index}`}
                  className={cn("absolute rounded-full", !isPreview && "weather-rain-drop")}
                  style={{
                    left: drop.left,
                    top: drop.top,
                    width: "2px",
                    height: `${drop.height}px`,
                    opacity: drop.opacity,
                    background:
                      "linear-gradient(180deg, rgba(236,244,255,0) 0%, rgba(236,244,255,0.92) 38%, rgba(173,205,255,0.92) 100%)",
                    boxShadow: isPreview
                      ? "0 0 4px rgba(196,220,255,0.14)"
                      : "0 0 6px rgba(196,220,255,0.18)",
                    transform: isPreview ? `translateX(${drop.drift}px)` : undefined,
                    ["--rain-duration" as string]: isPreview ? undefined : `${drop.duration}s`,
                    ["--rain-delay" as string]: isPreview ? undefined : `${drop.delay}s`,
                    ["--rain-drift" as string]: isPreview ? undefined : `${drop.drift}px`,
                  }}
                />
              )
            )}
        </div>
      )}

      {hasEffect("snow") && (
        isPreview ? (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(4.5px 4.5px at 12% 22%, rgba(255,255,255,0.88), transparent 72%), radial-gradient(4px 4px at 26% 36%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(4.5px 4.5px at 42% 18%, rgba(255,255,255,0.9), transparent 72%), radial-gradient(3.5px 3.5px at 58% 42%, rgba(255,255,255,0.78), transparent 72%), radial-gradient(4.5px 4.5px at 74% 24%, rgba(255,255,255,0.86), transparent 72%), radial-gradient(4px 4px at 88% 38%, rgba(255,255,255,0.8), transparent 72%), radial-gradient(3.5px 3.5px at 18% 54%, rgba(255,255,255,0.82), transparent 72%), radial-gradient(4px 4px at 68% 62%, rgba(255,255,255,0.8), transparent 72%)",
            }}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            {WEATHER_SNOW_FLAKES.map((flake, index) => (
              <div
                key={`${flake.left}-${index}`}
                className="weather-snow-flake absolute rounded-full"
                style={{
                  left: flake.left,
                  top: flake.top,
                  width: `${flake.size}px`,
                  height: `${flake.size}px`,
                  opacity: flake.opacity,
                  background:
                    "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.95), rgba(231,239,255,0.82) 60%, rgba(231,239,255,0.08) 100%)",
                  boxShadow: "0 0 8px rgba(233,241,255,0.22)",
                  ["--snow-duration" as string]: `${flake.duration}s`,
                  ["--snow-delay" as string]: `${flake.delay}s`,
                  ["--snow-drift" as string]: `${flake.drift}px`,
                }}
              />
            ))}
          </div>
        )
      )}

      {hasEffect("lightning") && (
        isPreview ? (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(72px_110px_at_78%_14%,rgba(244,248,255,0.28),rgba(214,228,255,0.06)_34%,transparent_72%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,22,0.06)_0%,rgba(5,10,22,0.24)_100%)]" />
          </>
        ) : (
          <>
            <div className="absolute left-[10%] top-[16%] h-24 w-[34%] rounded-full bg-slate-950/14 blur-3xl" />
            <div className="absolute right-[12%] top-[14%] h-28 w-[38%] rounded-full bg-slate-950/16 blur-3xl" />
            <div className="weather-storm-flash absolute inset-0 bg-[radial-gradient(56%_38%_at_76%_14%,rgba(239,245,255,0.55),rgba(214,229,255,0.18)_20%,transparent_58%)] mix-blend-screen" />
            {WEATHER_LIGHTNING_BOLTS.map((bolt, index) => (
              <div
                key={`${bolt.left}-${index}`}
                className="weather-lightning-bolt absolute"
                style={{
                  left: bolt.left,
                  top: bolt.top,
                  width: bolt.width,
                  height: bolt.height,
                  animationDelay: bolt.delay,
                  clipPath: bolt.clipPath,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(221,235,255,0.94) 44%, rgba(157,201,255,0.82) 76%, rgba(157,201,255,0) 100%)",
                  filter:
                    "drop-shadow(0 0 8px rgba(223,236,255,0.8)) drop-shadow(0 0 20px rgba(119,178,255,0.34))",
                }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-[linear-gradient(180deg,transparent_0%,rgba(8,15,28,0.08)_42%,rgba(8,15,28,0.26)_100%)]" />
          </>
        )
      )}

      {!isPreview && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />}
    </div>
  );
}
