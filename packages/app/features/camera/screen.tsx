import {
  View,
  YStack,
} from '@my/ui'
import { PhotoFile, VisionCamera } from 'app/components'

export function CameraScreen() {

  const onMediaCaptured = (media: PhotoFile) => {
    console.log('Media captured:', media)
  }

  return (
      <VisionCamera onMediaCaptured={onMediaCaptured} />
  )
}
