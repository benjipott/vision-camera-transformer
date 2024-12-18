import { NativeModules, Platform } from 'react-native'
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera'

const LINKING_ERROR =
  `The package 'vision-camera-transformer' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo managed workflow\n'

const VisionCameraTransformer = NativeModules.VisionCameraTransformer
  ? NativeModules.VisionCameraTransformer
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR)
        },
      }
    )

const plugin = VisionCameraProxy.initFrameProcessorPlugin('pipe', {})

/**
 * pipe from the camera preview
 */
export function pipe(frame: Frame) {
  'worklet'
  if (plugin == null) throw new Error('Failed to load Frame Processor Plugin "pipe"!')

  return plugin.call(frame) as any
}
