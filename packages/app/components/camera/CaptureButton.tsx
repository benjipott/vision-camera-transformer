import React, { useCallback } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import type { Camera, PhotoFile } from 'react-native-vision-camera'

import { View, ViewProps } from '@my/ui'

const AnimatedView = Animated.createAnimatedComponent(View)

export interface CaptureProps extends ViewProps {
  camera: React.RefObject<Camera>
  onMediaCaptured: (media: PhotoFile) => void
  minZoom: number
  maxZoom: number
  cameraZoom: Animated.SharedValue<number>
  flash: 'off' | 'on'
  enabled: boolean
}

const _CaptureButton: React.FC<CaptureProps> = ({
  camera,
  onMediaCaptured,
  minZoom,
  maxZoom,
  cameraZoom,
  flash,
  enabled,
  style,
  ...props
}): React.ReactElement => {
  const isPressingButton = useSharedValue<boolean>(false)

  const takePhoto = useCallback(async () => {
    try {
      if (camera.current == null) throw new Error('Camera ref is null!')

      console.log('Taking photo...')
      const photo = await camera.current.takePhoto({
        flash: flash,
        enableShutterSound: false,
      })
      onMediaCaptured(photo)
    } catch (e) {
      console.error('Failed to take photo!', e)
    }
  }, [camera, flash, onMediaCaptured])

  const onTap = Gesture.Tap()
    .onStart(() => {
      runOnJS(takePhoto)()
    })
    .onBegin(() => {
      isPressingButton.value = true
    })
    .onFinalize(() => {
      isPressingButton.value = false
    })

  const shadowStyle = useAnimatedStyle(
    () => ({
      backgroundColor: interpolateColor(
        Number(isPressingButton.value),
        [1, 0],
        ['#e34077', 'white']
      ),
      transform: [
        {
          scale: withDelay(
            isPressingButton.value ? 0 : 100,
            withSpring(isPressingButton.value ? 0.2 : 0.8, {
              mass: 1,
              damping: 35,
              stiffness: 300,
            })
          ),
        },
      ],
    }),
    [isPressingButton]
  )

  const buttonStyle = useAnimatedStyle(() => {
    let scale: number
    if (enabled) {
      if (isPressingButton.value) {
        scale = withRepeat(
          withSpring(1, {
            stiffness: 100,
            damping: 1000,
          }),
          -1,
          true
        )
      } else {
        scale = withSpring(0.9, {
          stiffness: 500,
          damping: 300,
        })
      }
    } else {
      scale = withSpring(0.6, {
        stiffness: 500,
        damping: 300,
      })
    }

    return {
      opacity: withTiming(enabled ? 1 : 0, {
        duration: 50,
        easing: Easing.linear,
      }),
      transform: [
        {
          scale: scale,
        },
      ],
    }
  }, [enabled, isPressingButton])

  return (
    <GestureDetector gesture={onTap}>
      <AnimatedView {...props} style={[buttonStyle, style]}>
        <AnimatedView f={1}>
          <AnimatedView style={[shadowStyle]} pos="absolute" w="$8" aspectRatio={1} br="$12" />
          <View w="$8" aspectRatio={1} br="$12" bw="$1.5" boc="white" />
        </AnimatedView>
      </AnimatedView>
    </GestureDetector>
  )
}

export const CaptureButton = React.memo(_CaptureButton)
