/**
 * Site-wide settings. If you fork StepLab, change these to your own details.
 */
export const CREATOR = {
  name: 'Deepa Subramanian',
  linkedin: 'https://www.linkedin.com/in/sdkdeepa',
}

/** True once `linkedin` above has been set to a real profile. */
export const hasCreatorLink = !CREATOR.linkedin.includes('REPLACE-WITH')

/** Where "Made with StepLab" in downloaded labs points to. */
export const STEPLAB_URL = 'https://sdkdeepa.github.io/steplab/'
