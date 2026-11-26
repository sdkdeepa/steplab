/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** true when built with STEPLAB_PWA=off (the maintainer's safety switch, see vite.config.ts). */
  readonly STEPLAB_PWA_OFF: boolean
}
