import { useIsForeground, usePreferredCameraDevice } from 'app/hooks'
import { Button, Icons, Paragraph, styled, View, YStack } from '@my/ui'
import { useAppState } from '@react-native-community/hooks'
import { useIsFocused } from '@react-navigation/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Reanimated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import {
  Camera,
  CameraProps,
  CameraRuntimeError,
  PhotoFile,
  Templates,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { CaptureButton } from './CaptureButton'
import { MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, SCREEN_HEIGHT, SCREEN_WIDTH } from './Constants'

import { detect } from 'vision-camera-transformer'

export { PhotoFile } from 'react-native-vision-camera'

const ReanimatedCamera = Reanimated.createAnimatedComponent(Camera)

const StyledCamera = styled(ReanimatedCamera, {
  f: 1,
  pos: 'absolute',
  t: 0,
  l: 0,
  r: 0,
  b: 0,
})

export interface VisionCameraProps {
  onMediaCaptured: (media: PhotoFile) => void
}

export const VisionCamera = ({
  onMediaCaptured,
  children,
}: React.PropsWithChildren<VisionCameraProps>) => {
  const cameraRef = useRef<Camera>(null)
  const [isCameraInitialized, setIsCameraInitialized] = useState(false)
  const zoom = useSharedValue(1)
  const [cameraPosition] = useState<'front' | 'back'>('back')
  let device = useCameraDevice(cameraPosition, {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera', 'telephoto-camera'],
  })
  // check if camera page is active
  const isFocussed = useIsFocused()
  const isForeground = useIsForeground()
  const appState = useAppState()

  const { minZoom, maxZoom, hasFlash } = useMemo(
    () => ({
      hasFlash: device?.hasFlash ?? false,
      minZoom: device?.minZoom ?? 1,
      maxZoom: Math.min(device?.maxZoom ?? 1, MAX_ZOOM_FACTOR),
    }),
    [device]
  )
  const { hasPermission, requestPermission } = useCameraPermission()

  const isActive = useMemo(
    () => appState === 'active' && isFocussed && isForeground,
    [appState, isFocussed, isForeground]
  )

  const [enableHdr, setEnableHdr] = useState(false)
  const [flash, setFlash] = useState<'off' | 'on'>('off')
  const [enableNightMode, setEnableNightMode] = useState(false)

  // camera device settings
  const [preferredDevice] = usePreferredCameraDevice()

  if (preferredDevice != null && preferredDevice.position === cameraPosition) {
    // override default device with the one selected by the user in settings
    device = preferredDevice
  }

  const screenAspectRatio = SCREEN_HEIGHT / SCREEN_WIDTH

  const canToggleNightMode = device?.supportsLowLightBoost ?? false

  const supports60Fps = useMemo(
    () => device?.formats.some((f) => f.maxFps >= 60),
    [device?.formats]
  )
  const targetFps = useMemo(() => (supports60Fps ? 60 : 50), [supports60Fps])
  const format = useCameraFormat(device, [
    ...Templates.FrameProcessing,
    { fps: targetFps },
    { videoAspectRatio: screenAspectRatio },
    { videoResolution: 'max' },
    { photoAspectRatio: screenAspectRatio },
    { photoResolution: 'max' },
    { photoHdr: enableHdr },
  ])
  const supportsHdr = format?.supportsPhotoHdr

  const fps = Math.min(format?.maxFps ?? 1, targetFps)

  const cameraAnimatedProps = useAnimatedProps<CameraProps>(() => {
    const z = Math.max(Math.min(zoom.value, maxZoom), minZoom)
    return {
      zoom: z,
    }
  }, [maxZoom, minZoom, zoom])

  const onError = useCallback((error: CameraRuntimeError) => {
    console.error(error)
  }, [])

  const onInitialized = useCallback(() => {
    console.log('Camera initialized!')
    setIsCameraInitialized(true)
  }, [])

  const onFlashPressed = useCallback(() => {
    setFlash((f) => (f === 'off' ? 'on' : 'off'))
  }, [])

  useEffect(() => {
    // Reset zoom to it's default everytime the `device` changes.
    zoom.value = device?.neutralZoom ?? 1
  }, [zoom, device])

  useEffect(() => {
    const f =
      format != null
        ? `(${format.photoWidth}x${format.photoHeight} photo / ${format.videoWidth}x${format.videoHeight}@${format.maxFps} video @ ${fps}fps)`
        : undefined
    console.log(`Camera: ${device?.name} | Format: ${f}`)
  }, [device?.name, format, fps])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'

    const barcodes = detect(frame)

    // runAtTargetFps(10, () => {
    //   'worklet'
    //   console.log(
    //     `${frame.timestamp}: ${frame.width}x${frame.height} ${frame.pixelFormat} Frame (${frame.orientation})`
    //   )
    // })
  }, [])

  const videoHdr = format?.supportsVideoHdr && enableHdr
  const photoHdr = format?.supportsPhotoHdr && enableHdr && !videoHdr

  useEffect(() => {
    if (!hasPermission) {
      requestPermission()
    }
  }, [hasPermission])

  if (!hasPermission) return <Paragraph>No permission</Paragraph>
  if (!device) return <Paragraph>No Camera device</Paragraph>

  return (
    <View f={1}>
      <StyledCamera
        ref={cameraRef}
        device={device}
        format={format}
        isActive={isActive}
        onInitialized={onInitialized}
        onError={onError}
        fps={fps}
        photoHdr={photoHdr}
        lowLightBoost={device.supportsLowLightBoost && enableNightMode}
        enableZoomGesture
        animatedProps={cameraAnimatedProps}
        photoQualityBalance="quality"
        outputOrientation="device"
        torch={flash}
        photo
        enableFpsGraph={__DEV__}
        frameProcessor={frameProcessor}
      />

      <CaptureButton
        camera={cameraRef}
        cameraZoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        enabled={isCameraInitialized && isActive}
        onMediaCaptured={onMediaCaptured}
        flash={flash}
        als="center"
        pos="absolute"
        pb="25%"
        b={SAFE_AREA_PADDING.paddingBottom}
      />

      <YStack
        als="flex-end"
        jc="flex-end"
        ai="flex-end"
        p="$4"
        gap="$4"
        b={SAFE_AREA_PADDING.paddingBottom}
        pb="25%"
        pos="absolute"
      >
        {hasFlash && (
          <Button
            circular
            icon={flash === 'on' ? Icons.FlashlightOff : Icons.Flashlight}
            onPress={onFlashPressed}
          />
        )}
        {supportsHdr && (
          <Button circular icon={Icons.HardDrive} onPress={() => setEnableHdr((h) => !h)} />
        )}
        {canToggleNightMode && (
          <Button circular icon={Icons.Moon} onPress={() => setEnableNightMode(!enableNightMode)} />
        )}
      </YStack>
      {children}
    </View>
  )
}
