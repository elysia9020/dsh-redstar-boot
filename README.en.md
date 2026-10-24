<p align="center">
  <img src="docs/icon-180.png" width="96" alt="dsh-redstar-boot">
</p>

# dsh-redstar-boot

**A black-red boot sequence for DeepSeek Harness: a spinning red star, a hex data
stream, three self-check lines, the original six-step authorization flow, and a
typed Chinese/Russian "welcome, comrade" finale.**

| Self-check | Finale |
| --- | --- |
| ![self-check](docs/preview-boot.jpg) | ![finale](docs/preview-finale.jpg) |

## What it does

- Black-red plate across the whole sequence; the red star is the only accent.
- A five-point star above the centre spins at 0.62 s per turn, then stops exactly
  at the viewport centre in the finale and bursts out.
- Full-screen hexadecimal rain; the three check lines type themselves with a
  blinking caret and dim once read.
- The original six-step authorization flow is unchanged apart from the palette.
- Finale: `链接成功 / CONNECTION ESTABLISHED`, then a typed
  `欢迎上线，同志` and `Добро пожаловать на службу, товарищ`, while the star
  stops, centres, scales up and disappears.
- The DeepSeek whale is the official Harness app icon (inlined 320 px PNG).
- Settings: play mode, speed, identity, interaction, sound, TTS voice, copy.

## Install

```sh
dsh plugin --profile web add dsh-redstar-boot
# or from a local tarball
dsh plugin --profile web add ./dsh-redstar-boot-0.1.0.tgz
```

On the desktop client use **Settings → Plugins**, then fully restart.

## Audio

This package ships **no** third-party recordings (the upstream voice clips come
from a third-party video). Voice falls back to the system TTS engine and sound
effects to WebAudio synthesis. Drop mp3 files into `lib/assets/` to use real
recordings.

## Compatibility

`dsh web` and DeepSeek Harness Desktop. Do not install it alongside
`dsh-startup-screen` — both would play their own intro.

## License

MIT. Derived from [dsh-startup-screen](https://github.com/6shenhonghong9/dsh-startup-screen)
by [@6shenhonghong9](https://github.com/6shenhonghong9). See [CREDITS.md](CREDITS.md).
