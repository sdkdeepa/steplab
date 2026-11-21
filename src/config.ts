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
export const STEPLAB_URL = 'https://steplab.dev/'

/** Where the editor extension is published (shown on the home page). */
export const VSCODE_URL = 'https://marketplace.visualstudio.com/items?itemName=sdkdeepa.steplab'
export const OPENVSX_URL = 'https://open-vsx.org/extension/sdkdeepa/steplab'

/** The published Docker image and the Docker guide (shown on the home page). */
export const DOCKER_IMAGE = 'ghcr.io/sdkdeepa/steplab'
export const DOCKER_GUIDE_URL = 'https://github.com/sdkdeepa/steplab#run-it-with-docker'
